import React, {useState} from 'react';
import {SafeAreaView, Text, View} from 'react-native';
import Logo from './Logo';
import InputField from './InputField';
import CustomButton from './CustomButton';
import {API_URL_PROD} from '@env';

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

  const handleSendCode = async () => {
    setUserDoesNotExist(false);
    setCodeSent(false);
    const response = await fetch(`${apiUrl}/authentication/forgotpassword`, {
      method: 'POST',
      body: JSON.stringify({
        user_input: userInput,
      }),
    });

    const data = await response.json();

    console.log(data)
    if (response.ok) {
      setCodeSent(true);
      setUserId(data.user_id);
    } else if (response.status === 400) {
      if (data.reason === 'UserNotFoundException') {
        setUserDoesNotExist(true);
      } else {
        setUserDoesNotExist(false);
      }
    }
  };

  const handleCheckCode = async () => {
    console.log(userId);
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

    if (response.ok){
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <View>
        <Logo />
      </View>

      <View
        style={{
          top: '30%',
          width: '75%',
          alignSelf: 'center',
        }}>
        <InputField
          placeHolder={'Email'}
          validationRegex={combinedRegex}
          errorMessage={'Enter a valid email'}
          text={userInput}
          setText={setUserInput}
          onValidChange={setInputValid}
        />
        {userDoesNotExists ? (
          <Text>
            The email you submitted is not registered with an
            existing user
          </Text>
        ) : codeSent ? (
          <>
            <Text>
              A code has been sent to your provided email
            </Text>
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
          disabled={!verificationCodeInputValid || !codeSent || !passwordValid}
          handlePress={handleCheckCode}
        />
      )}
    </SafeAreaView>
  );
}
