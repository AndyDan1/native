import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Linking,
} from "react-native";
import RiveWrapper, { isRiveSupported } from "../components/RiveWrapper";
import { useVoiceProcessor, APP_STATE } from "../hooks/useVoiceProcessor";

const TalkingTomScreen = () => {
  const { appState, permissionStatus, requestPermission, permissionResponse } = useVoiceProcessor();
  const riveRef = useRef(null);
  const [isRiveAvailable, setIsRiveAvailable] = useState(isRiveSupported);

  const handleRiveError = (error) => {
    console.warn("Rive error, switching to placeholder:", error);
    setIsRiveAvailable(false);
  };

  const handleGrantPermission = async () => {
    const result = await requestPermission();
    if (
      result?.status !== "granted" &&
      permissionResponse &&
      !permissionResponse.canAskAgain
    ) {
      Linking.openSettings();
    }
  };

  useEffect(() => {
    if (!riveRef.current || !isRiveAvailable) return;

    try {
      riveRef.current.setInputState("State Machine 1", "Talk", false);
      riveRef.current.setInputState("State Machine 1", "Hear", false);
      riveRef.current.setInputState("State Machine 1", "Check", false);

      switch (appState) {
        case APP_STATE.HEARING:
        case APP_STATE.CHECKING:
          riveRef.current.setInputState("State Machine 1", "Hear", true);
          break;
        case APP_STATE.TALKING:
          riveRef.current.setInputState("State Machine 1", "Talk", true);
          break;
      }
    } catch (e) {
      setIsRiveAvailable(false);
    }
  }, [appState, isRiveAvailable]);

  if (permissionStatus === "denied" || permissionStatus === "undetermined") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.text}>Microphone permission is required</Text>
          <TouchableOpacity style={styles.button} onPress={handleGrantPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <RiveWrapper
        ref={riveRef}
        url={
          Image.resolveAssetSource(
            require("../assets/5628-11215-wave-hear-and-talk.riv"),
          ).uri
        }
        stateMachineName="State Machine 1"
        artboardName="Artboard"
        style={styles.rive}
        autoplay={true}
        onError={handleRiveError}
      />

      <View style={styles.statusIndicator}>
        <Text style={styles.statusText}>
          {appState === APP_STATE.HEARING || appState === APP_STATE.CHECKING
            ? "👂 Listening..."
            : appState === APP_STATE.TALKING
              ? "😺 Talking..."
              : "💤 Idle"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A2E",
  },
  rive: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  warningText: {
    color: "#FFD700",
    marginBottom: 40,
    fontSize: 14,
    opacity: 0.8,
  },
  characterPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#4E4E50",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#333",
  },
  characterHearing: {
    backgroundColor: "#00D2FF",
    transform: [{ scale: 1.1 }],
    borderColor: "#FFF",
  },
  characterTalking: {
    backgroundColor: "#FF0055",
    transform: [{ scale: 1.2 }],
    borderColor: "#FFF",
  },
  characterChecking: {
    backgroundColor: "#FBCA1F",
    opacity: 0.8,
  },
  eye: {
    fontSize: 30,
    marginBottom: 10,
  },
  mouth: {
    width: 60,
    height: 10,
    backgroundColor: "#333",
    borderRadius: 5,
  },
  infoText: {
    color: "#888",
    marginTop: 40,
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    color: "#E94560",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#E94560",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  statusIndicator: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 20,
  },
  statusText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});

export default TalkingTomScreen;
