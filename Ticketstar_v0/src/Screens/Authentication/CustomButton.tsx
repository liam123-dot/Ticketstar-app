import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MainColour } from "../../OverallStyles";

export default function CustomButton({handlePress, title, disabled}) {
  const buttonStyle = StyleSheet.create({
    buttonContainer: {
      position: 'absolute', // This makes the bottom, left, right, top attributes work
      bottom: '11%', // This positions the button 20% from the bottom of the screen
      alignSelf: 'center', // This centers the button horizontally
      backgroundColor: disabled ? 'lightgrey': MainColour,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      width: '75%',
    },
  });

  return (
    <TouchableOpacity style={buttonStyle.buttonContainer} onPress={handlePress} disabled={disabled}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: 300,
        }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
