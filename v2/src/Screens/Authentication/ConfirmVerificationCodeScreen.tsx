import React, {useEffect, useState} from 'react';
import {API_URL_PROD} from '@env';
import {View, Alert, SafeAreaView, Text, ActivityIndicator} from 'react-native';
import {authenticationStyles} from '../Styling/authentication';
import Logo from './Logo';
import InputField from './InputField';
import CustomButton from './CustomButton';
import FinePrintButton from './FinePrintButton';

function ConfirmVerificationCodeScreen({navigation, route}) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifiationCodeInputValid, setIsVerificartionCodeInputValid] =
    useState(false);

  const {
    email,
    phone_number,
    method,
    phone_verified,
    email_verified,
    cognito,
    from_sign_up,
  } = route.params;
  const [loading, setLoading] = useState(false);

  const apiUrl = API_URL_PROD;

  const send_code = async resend => {
    let response;

    // send verification code by email
    if (method === 'EMAIL') {
      console.log('send email');

      response = await fetch(
        apiUrl + '/authentication/initiateemailverification',
        {
          method: 'POST',
          body: JSON.stringify({
            user_email: email,
          }),
        },
      );

      console.log(response);

      console.log(await response.json());
    } else if (cognito && !from_sign_up) {
      response = await fetch(
        apiUrl + '/authentication/resendconfirmationcode',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email,
          }),
        },
      );

      console.log(await response.json());
    } else if (cognito && resend) {
      response = await fetch(
        apiUrl + '/authentication/resendconfirmationcode',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email,
          }),
        },
      );
    }

    console.log(await response.json());
  };

  useEffect(() => {
    setLoading(true);
    send_code();
    setLoading(false);
  }, []);

  const handleResend = () => {
    setLoading(true);
    send_code(true);
    setLoading(false);
  };

  async function handleConfirmVerificationCode() {
    setLoading(true);
    try {
      let response;
      let result;
      if (method === 'SMS') {
        response = await fetch(
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

        result = await response.json();
      } else {
        response = await fetch(
          apiUrl + '/authentication/confirmemailverification',
          {
            method: 'POST',
            body: JSON.stringify({
              user_email: email,
              code: verificationCode,
            }),
          },
        );

        result = await response.json();
      }

      if (response.ok) {
        Alert.alert('Success', result.message || 'Verification successful');

        if (method === 'SMS' && !email_verified) {
          navigation.navigate('ConfirmVerificationCode', {
            email: email,
            method: 'EMAIL',
            email_verified: false,
          });
        } else {
          navigation.navigate('SignIn');
        }
      } else {
        Alert.alert('Error', result.message || 'Verification failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while verifying the code');
      console.error(error);
    }
    setLoading(false);
  }

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
            <Text>method: {method}</Text>
            <Text>email: {email}</Text>
            <Text>phone_number: {phone_number}</Text>
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
