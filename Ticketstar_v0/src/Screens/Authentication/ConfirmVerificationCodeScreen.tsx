import React, {useEffect, useState} from 'react';
import {API_URL_PROD} from '@env';
import { View, Alert, SafeAreaView, Text, ActivityIndicator, Keyboard, TouchableWithoutFeedback } from "react-native";
import Logo from './Logo';
import InputField from './InputField';
import CustomButton from './CustomButton';
import FinePrintButton from './FinePrintButton';

function ConfirmVerificationCodeScreen({navigation, route}) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifiationCodeInputValid, setIsVerificartionCodeInputValid] =
    useState(false);

  const {email} = route.params;
  const [loading, setLoading] = useState(false);

  const apiUrl = API_URL_PROD;

  const handleResend = async () => {};

  const handleConfirmVerificationCode = async () => {

    setLoading(true);

    const response = await fetch(
      `${apiUrl}/authentication/verifyconfirmationcode`,
      {
        method: 'POST',
        body: JSON.stringify({
          email: email,
          confirmation_code: verificationCode,
        })
      }
    )

    if (response.ok){

      navigation.navigate('SignIn');

    } else {

      const result = await response.json();

      if (result.reason === 'CodeMismatchException'){

        Alert.alert('Incorrect Code');

      } else {
        console.error(result);
      }

    }

    setLoading(false);

  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Logo />

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <>
            <View
              style={{
                flexDirection: 'column',
                // alignItems: /'center',
                // justifyContent: 'center',
                width: '75%',
                bottom: '2%',
                marginTop: 10,
                marginBottom: 20,
              }}>
              <Text style={{fontSize: 14, textAlign: 'left'}}>
                A verification email has been sent to:
                <Text style={{fontWeight: 'bold', fontSize: 16}}> {email}</Text>
              </Text>
              <InputField
                placeHolder={'Verification Code'}
                validationRegex={'/\\S/'}
                text={verificationCode}
                setText={setVerificationCode}
                onValidChange={setIsVerificartionCodeInputValid}
              />
            </View>

            <FinePrintButton title={'Resend code'} handlePress={handleResend} />
            <CustomButton
              title={'Submit'}
              handlePress={handleConfirmVerificationCode}
            />
          </>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

export default ConfirmVerificationCodeScreen;
