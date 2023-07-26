import React from 'react';
import {Text, TouchableOpacity} from 'react-native';

export default function FinePrintButton({title, handlePress}) {
  return (
    <TouchableOpacity
      style={{
        position: 'absolute',
        bottom: '5%', // This positions the button 20% from the bottom of the screen
        alignSelf: 'center', // This centers the button horizontally
      }}
      onPress={handlePress}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: 200,
        }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
