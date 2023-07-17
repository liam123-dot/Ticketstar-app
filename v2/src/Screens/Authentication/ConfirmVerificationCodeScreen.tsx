import React, { useState } from 'react';
import { API_URL_PROD } from '@env'
import { View, TextInput, Alert, TouchableOpacity, Text } from "react-native";
import {authenticationStyles} from "../Styling/authentication";

function ConfirmVerificationCodeScreen({ navigation, route }) {
  const [verificationCode, setVerificationCode] = useState('');

  const apiUrl = API_URL_PROD;

  const {email} = route.params;

  function handleVerificationCodeChange(code) {
    setVerificationCode(code);
  }

  async function handleConfirmVerificationCode() {
    try {
      const response = await fetch(
          (apiUrl + '/authentication/verifyconfirmationcode'),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email,
              confirmation_code: verificationCode,
            }),
          }
      );

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Success', result.message || 'Verification successful');
        navigation.navigate("SignIn");
      } else {
        Alert.alert('Error', result.message || 'Verification failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while verifying the code');
      console.error(error);
    }
  }

  return (
      <View style={authenticationStyles.container}>
          <Text>A verification code has been sent to: </Text>
        <TextInput
            style={authenticationStyles.input}
            placeholder="Enter verification code"
            placeholderTextColor="#888"
            value={verificationCode}
            onChangeText={handleVerificationCodeChange}
        />
        <TouchableOpacity style={authenticationStyles.button} onPress={handleConfirmVerificationCode}>
          <Text style={authenticationStyles.buttonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
  );
}


export default ConfirmVerificationCodeScreen;
