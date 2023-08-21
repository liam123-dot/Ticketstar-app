import React, {useState, useEffect} from 'react';
import {API_URL_PROD} from '@env';
import {
  View,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  TouchableWithoutFeedback, Keyboard, Text
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Logo from './Logo';
import InputField from './InputField';
import CustomButton from './CustomButton';
import FinePrintButton from './FinePrintButton';
import { loadListings, loadPurchases } from "../../Dataloaders";
import { BackButton } from "../BackButton";
import { CheckSellerVerified } from "../../CheckSellerVerified";
import { RecordAppOpen } from "../../Metrics";

const SignInScreen = () => {
  const navigation = useNavigation();
  const [emailInput, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const apiUrl = API_URL_PROD;

  useFocusEffect(
    React.useCallback(() => {
      setEmail('');
      setPassword('');
      setIsEmailValid(false);
      setIsPasswordValid(false);
    }, []),
  );

  const onSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl + '/authentication/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({email: emailInput, password}),
      });

      const result = await response.json();
      console.log(result);
      if (response.ok) {
        const {
          user_id,
          first_name,
          surname,
          email,
          email_verified,
        } = result.attributes;

        await AsyncStorage.multiSet([
          ['user_id', user_id.toString()],
          ['first_name', first_name],
          ['surname', surname],
          ['email', email],
          ['email_verified', email_verified.toString()],
        ]);

        CheckSellerVerified();
        RecordAppOpen();

        if (email_verified === 'true') {
          loadListings();
          loadPurchases();
          navigation.navigate('Home', {
            screen: 'HomeTabs',
            params: {
              screen: 'Search',
            },
          });
        } else {
          navigation.navigate('ConfirmVerificationCode', {
            email: email,
          });
        }
      } else {
        console.error(result);
        if (result.error === 'UserNotConfirmedException') {
          navigation.navigate('ConfirmVerificationCode', {
            email: emailInput,
          });
        }
        Alert.alert(
          'Error',
          result.message || 'An error occurred during sign-in',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while signing in');
      console.error(error);
    }
    setLoading(false);
  };

  const handleSetEmail = email => {

    setEmail(email.toLowerCase());

  };

  const forgotPasswordClick = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
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
                placeHolder={'Email'}
                text={emailInput}
                setText={handleSetEmail}
                validationRegex={emailRegex}
                errorMessage={'Please enter a valid email'}
                onValidChange={setIsEmailValid}
              />
              <InputField
                placeHolder={'Password'}
                text={password}
                setText={setPassword}
                onValidChange={setIsPasswordValid}
                secureEntry={true}
              />
            </View>

            <CustomButton
              title={'Log In'}
              disabled={!(isEmailValid && isPasswordValid)}
              handlePress={onSubmit}
            />

            <FinePrintButton
              title={'Forgot Password?'}
              handlePress={forgotPasswordClick}
            />
          </>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default SignInScreen;
