import { useState, useEffect, useRef } from "react";
import { Audio } from "expo-av";

const SPEAK_THRESHOLD = -25;
const SILENCE_THRESHOLD = -35;
const SILENCE_DURATION = 800;
const POLLING_INTERVAL = 100;

export const APP_STATE = {
  IDLE: "IDLE",
  HEARING: "HEARING",
  CHECKING: "CHECKING",
  TALKING: "TALKING",
};

export const useVoiceProcessor = () => {
  const [appState, setAppState] = useState(APP_STATE.IDLE);
  const appStateRef = useRef(APP_STATE.IDLE);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  const recordingRef = useRef(null);
  const soundRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const speechStartOffsetRef = useRef(0);

  const updateState = (newState) => {
    appStateRef.current = newState;
    setAppState(newState);
  };

  const safeUnloadRecording = async () => {
    if (recordingRef.current) {
      const rec = recordingRef.current;
      recordingRef.current = null;
      try {
        await rec.stopAndUnloadAsync();
      } catch (e) {}
    }
  };

  const safeUnloadSound = async () => {
    if (soundRef.current) {
      const snd = soundRef.current;
      soundRef.current = null;
      try {
        await snd.unloadAsync();
      } catch (e) {}
    }
  };

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: 1,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {}
    };

    setupAudio();

    return () => {
      safeUnloadRecording();
      safeUnloadSound();
      clearSilenceTimer();
    };
  }, []);

  const startMonitoring = async () => {
    if (permissionResponse?.status !== "granted") {
      const resp = await requestPermission();
      if (resp.status !== "granted") return;
    }

    try {
      await safeUnloadRecording();
      await new Promise((resolve) => setTimeout(resolve, 300));

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        onRecordingStatusUpdate,
        POLLING_INTERVAL,
      );

      recordingRef.current = recording;
      updateState(APP_STATE.IDLE);
    } catch (err) {}
  };

  const onRecordingStatusUpdate = (status) => {
    if (!status.canRecord) return;

    const metering = status.metering;
    const currentState = appStateRef.current;

    if (metering > SPEAK_THRESHOLD) {
      if (
        currentState === APP_STATE.IDLE ||
        currentState === APP_STATE.CHECKING
      ) {
        if (currentState === APP_STATE.IDLE) {
          // Calculate offset to skip IDLE silence during playback (leave 300ms buffer)
          speechStartOffsetRef.current = Math.max(
            0,
            status.durationMillis - 300,
          );
        }
        updateState(APP_STATE.HEARING);
      }
      clearSilenceTimer();
    } else if (
      metering < SILENCE_THRESHOLD &&
      currentState === APP_STATE.HEARING
    ) {
      updateState(APP_STATE.CHECKING);
      silenceTimerRef.current = setTimeout(stopAndPlayback, SILENCE_DURATION);
    }
  };

  const stopAndPlayback = async () => {
    if (!recordingRef.current || appStateRef.current !== APP_STATE.CHECKING)
      return;

    try {
      updateState(APP_STATE.TALKING);
      clearSilenceTimer();
      const uri = recordingRef.current.getURI();
      await safeUnloadRecording();

      await new Promise((resolve) => setTimeout(resolve, 300));

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: false,
          positionMillis: speechStartOffsetRef.current,
          volume: 1.0,
        },
      );

      soundRef.current = sound;

      await sound.setRateAsync(1.5, false);
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          safeUnloadSound().then(() => {
            setTimeout(startMonitoring, 300);
          });
        }
      });
    } catch (err) {
      updateState(APP_STATE.IDLE);
      startMonitoring();
    }
  };

  useEffect(() => {
    if (permissionResponse?.status === "granted") {
      startMonitoring();
    }
  }, [permissionResponse]);

  return {
    appState,
    requestPermission,
    permissionStatus: permissionResponse?.status,
    permissionResponse,
  };
};
