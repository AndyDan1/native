import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import TalkingTomScreen from './screens/TalkingTomScreen';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <TalkingTomScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
});
