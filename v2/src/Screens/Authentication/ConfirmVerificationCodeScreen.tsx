import React, {useState} from 'react';
import {API_URL_PROD} from '@env';
import {
  View,
  TextInput,
  Alert,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import {authenticationStyles} from '../Styling/authentication';
import Logo from './Logo';
import InputField from './InputField';
import CustomButton from "./CustomButton";

function ConfirmVerificationCodeScreen({navigation, route}) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifiationCodeInputValid, setIsVerificartionCodeInputValid] =
    useState(false);

  const apiUrl = API_URL_PROD;

  const {email} = route.params;

  async function handleConfirmVerificationCode() {
    try {
      const response = await fetch(
        apiUrl + '/authentication/verifyconfirmationcode',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            confirmation_code: verificationCode,
          }),
        },
      );

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Success', result.message || 'Verification successful');
        navigation.navigate('SignIn');
      } else {
        Alert.alert('Error', result.message || 'Verification failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while verifying the code');
      console.error(error);
    }
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Logo />
      <View
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '75%',
          bottom: '2%',
        }}>
        <InputField
          placeHolder={'Verification Code'}
          validationRegex={'/\\S/'}
          text={verificationCode}
          setText={setVerificationCode}
          onValidChange={setIsVerificartionCodeInputValid}
        />
      </View>
      <CustomButton title={"Submit"} handlePress={handleConfirmVerificationCode}/>
    </SafeAreaView>
  );
}

export default ConfirmVerificationCodeScreen;
