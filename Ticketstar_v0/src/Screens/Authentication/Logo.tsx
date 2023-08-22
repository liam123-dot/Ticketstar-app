import React from 'react';
import { StyleSheet, Text, View } from "react-native";

export default function Logo() {

  const style = StyleSheet.create({
    logoStyle: {
      fontWeight: '900',
      fontSize: 60,
      alignSelf: 'center',
      position: 'absolute',
      top: '6%',
    },
  })

  return (
      <Text style={style.logoStyle}>TicketStar</Text>
  );
}
