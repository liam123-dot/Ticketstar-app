import React, {useEffect, useState} from 'react';
import {API_URL_PROD} from '@env';
import {View, Alert, SafeAreaView, Text, ActivityIndicator} from 'react-native';
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

  };

  return (
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
              alignItems: 'center',
              justifyContent: 'center',
              width: '75%',
              bottom: '2%',
            }}>
            <Text>A verification email has been sent to: {email}</Text>
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
  );
}

export default ConfirmVerificationCodeScreen;
