import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, TouchableOpacity, Text } from "react-native";

function ConfirmVerificationCodeScreen({ navigation, route }) {
  const [verificationCode, setVerificationCode] = useState('');

  const { email } = route.params;

  function handleVerificationCodeChange(code) {
    setVerificationCode(code);
  }

  async function handleConfirmVerificationCode() {
    try {
      console.log(email)
      const response = await fetch(
        'https://lmedajqatl.execute-api.eu-west-2.amazonaws.com/Prod/VerifyConfirmationCode',
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
        navigation.navigate("Home");
      } else {
        Alert.alert('Error', result.message || 'Verification failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while verifying the code');
      console.error(error);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter verification code"
        placeholderTextColor="#888"
        value={verificationCode}
        onChangeText={handleVerificationCodeChange}
      />
      <TouchableOpacity style={styles.button} onPress={handleConfirmVerificationCode}>
        <Text style={styles.buttonText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  input: {
    width: '80%',
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  button: {
    width: '80%',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#3f51b5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default ConfirmVerificationCodeScreen;
