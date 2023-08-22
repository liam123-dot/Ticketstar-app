import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  SafeAreaView,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Logo from './Logo';
import InputField from './InputField';
import CustomButton from './CustomButton';
import {API_URL_PROD} from '@env';
import {BackButton} from '../BackButton';

export default function ForgotPasswordScreen({navigation}) {
  const apiUrl = API_URL_PROD;
  const combinedRegex = /^([^\s@]+@[^\s@]+\.[^\s@]+)$/;

  const [userInput, setUserInput] = useState('');
  const [inputValid, setInputValid] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [userDoesNotExists, setUserDoesNotExist] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationCodeInputValid, setVerificationCodeInputValid] =
    useState(null);
  const [password, setPassword] = useState('');
  const [passwordValid, setPasswordValid] = useState(false);

  const [userId, setUserId] = useState(null);

  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    setLoading(true);
    setUserDoesNotExist(false);
    setCodeSent(false);
    const response = await fetch(`${apiUrl}/authentication/forgotpassword`, {
      method: 'POST',
      body: JSON.stringify({
        user_input: userInput,
      }),
    });

    const data = await response.json();

    console.log(response);
    console.log(data);

    if (response.ok) {
      setCodeSent(true);
      setUserId(data.user_id);
    } else if (response.status === 400) {
      if (data.reason === 'UserNotFoundException') {
        setUserDoesNotExist(true);
      } else {
        if (data.reason === 'LimitExceededException') {
          Alert.alert('Retry Limit Exceeded', 'Please try again later');
        }

        setUserDoesNotExist(false);
      }
      console.log(data);
    }
    setLoading(false);
  };

  const handleSetEmail = email => {
    setUserInput(email.toLowerCase());
  };

  const handleCheckCode = async () => {
    setLoading(true);
    const response = await fetch(
      `${apiUrl}/authentication/confirmforgotpassword`,
      {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          confirmation_code: verificationCode,
          new_password: password,
        }),
      },
    );

    if (response.ok) {
      navigation.goBack();
    } else {
      const data = await response.json();
      console.log(data);
    }
    setLoading(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
        <BackButton navigation={navigation} params={'SignIn'} />
        <Logo />

        {loading ? (
          <View
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : (
          <>
            <View
              style={{
                top: '30%',
                width: '75%',
                alignSelf: 'center',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
              <InputField
                placeHolder={'Email'}
                validationRegex={combinedRegex}
                errorMessage={'Enter a valid email'}
                text={userInput}
                setText={handleSetEmail}
                onValidChange={setInputValid}
              />
              {userDoesNotExists ? (
                <Text>
                  The email you submitted is not registered with an existing
                  user
                </Text>
              ) : codeSent ? (
                <>
                  <Text>A code has been sent to your provided email</Text>
                  <InputField
                    placeHolder={'Verification Code'}
                    validationRegex={/\S/}
                    errorMessage={'Enter a non-empty code'}
                    text={verificationCode}
                    setText={setVerificationCode}
                    onValidChange={setVerificationCodeInputValid}
                  />
                  <InputField
                    placeHolder={'New Password'}
                    validationRegex={
                      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
                    }
                    errorMessage={
                      'Password requirements:\n8 characeters\nAt least one uppercase character\nAt least one number\nAt least one special character'
                    }
                    text={password}
                    setText={setPassword}
                    onValidChange={setPasswordValid}
                    secureEntry={true}
                  />
                </>
              ) : (
                <></>
              )}
            </View>
            {!codeSent ? (
              <CustomButton
                title={'Submit Email'}
                disabled={!inputValid}
                handlePress={handleSendCode}
              />
            ) : (
              <CustomButton
                title={'Submit Verification Code'}
                disabled={
                  !verificationCodeInputValid || !codeSent || !passwordValid
                }
                handlePress={handleCheckCode}
              />
            )}
          </>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
