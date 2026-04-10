import React from "react";
import { View, Text, StyleSheet } from "react-native";

let Rive = null;
let isRiveSupported = false;

try {
  Rive = require("rive-react-native").default;
  isRiveSupported = true;
} catch (e) {
  console.log("Rive native module not available (expected in Expo Go)");
}

const RiveWrapper = React.forwardRef((props, ref) => {
  if (!isRiveSupported || !Rive) {
    if (props.onError) {
      setTimeout(() => props.onError("Rive not supported"), 100);
    }
    return null;
  }

  return <Rive ref={ref} {...props} />;
});

export default RiveWrapper;
export { isRiveSupported };
