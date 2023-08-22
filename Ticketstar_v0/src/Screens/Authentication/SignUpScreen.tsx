import React, {useState} from 'react';
import {API_URL_PROD} from '@env';
import {
  View,
  Alert,
  SafeAreaView,
  ActivityIndicator, Keyboard, TouchableWithoutFeedback, Text
} from "react-native";
import Logo from './Logo';
import FinePrintButton from './FinePrintButton';
import CustomButton from './CustomButton';
import InputField from './InputField';
import { BackButton } from "../BackButton";

const nameValidation = /^.{2,}$/;

const emailValidation = /^[^\s@]+@exeter\.ac\.uk$/;

const passwordValidation =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

const SignUpScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [isFirstNameValid, setIsFirstNameValid] = useState(false);
  const [isLastNameValid, setIsLastNameValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const [loading, setLoading] = useState(false);

  const apiUrl = API_URL_PROD;

  const onSubmit = async () => {
    const userData = {
      email,
      password,
      firstName,
      lastName,
    };

    setLoading(true);

    try {
      const response = await fetch(apiUrl + '/authentication/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Registration successful');

        navigation.navigate('ConfirmVerificationCode', {
          email: email,
        });
      } else {
        if (response.status === 401) {
          Alert.alert(result.message);
        } else {
          console.log(result);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while registering');
      console.error(error);
    }
    setLoading(false);
  };

  const signInClick = () => {
    navigation.navigate('SignIn');
  };

  const handleSetEmail = email => {

    setEmail(email.toLowerCase());

  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
        }}>
        <BackButton navigation={navigation} params={'MainPage'}/>

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
              <InputField
                placeHolder={'First Name'}
                text={firstName}
                setText={setFirstName}
                validationRegex={nameValidation}
                onValidChange={setIsFirstNameValid}
              />
              <InputField
                placeHolder={'Last Name'}
                text={lastName}
                setText={setLastName}
                validationRegex={nameValidation}
                onValidChange={setIsLastNameValid}
              />
              <InputField
                placeHolder={'Email'}
                text={email}
                setText={handleSetEmail}
                validationRegex={emailValidation}
                errorMessage={'Must be an exeter.ac.uk email'}
                onValidChange={setIsEmailValid}
              />
              <InputField
                placeHolder={'Password'}
                text={password}
                setText={setPassword}
                validationRegex={passwordValidation}
                errorMessage={
                  'Password requirements:\n8 characeters\nAt least one uppercase character\nAt least one number\nAt least one special character'
                }
                onValidChange={setIsPasswordValid}
                secureEntry={true}
              />
            </View>

            <CustomButton
              title={'Sign Up'}
              disabled={
                !(
                  isFirstNameValid &&
                  isLastNameValid &&
                  isEmailValid &&
                  isPasswordValid
                )
              }
              handlePress={onSubmit}
            />

            <FinePrintButton
              title={'Existing User? Login Now'}
              handlePress={signInClick}
            />
          </>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default SignUpScreen;
