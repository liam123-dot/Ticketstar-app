import React, {useState, useEffect} from 'react';
import {API_URL_PROD} from '@env';
import {
  View,
  TextInput,
  Alert,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Logo from './Logo';
import InputField from './InputField';
import CustomButton from './CustomButton';
import FinePrintButton from './FinePrintButton';
import Icon from 'react-native-vector-icons/FontAwesome';

const SignInScreen = () => {
  const navigation = useNavigation();
  const [emailInput, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  // const emailRegex = /^[^\s@]+@exeter\.ac\.uk$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    try {
      const response = await fetch(apiUrl + '/authentication/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({email: emailInput, password}),
      });

      const result = await response.json();
      if (response.ok) {
        const {
          user_id,
          first_name,
          surname,
          email,
          phone_number,
          email_verified,
          phone_number_verified,
        } = result.attributes;

        await AsyncStorage.multiSet([
          ['user_id', user_id.toString()],
          ['first_name', first_name],
          ['surname', surname],
          ['email', email],
          ['phone_number', phone_number],
          ['email_verified', email_verified.toString()],
          ['phone_number_verified', phone_number_verified.toString()],
        ]);

        navigation.navigate('Home', {
          screen: 'HomeTabs',
          params: {
            screen: 'Search',
          },
        });
      } else {
        Alert.alert(
          'Error',
          result.message || 'An error occurred during sign-in',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while signing in');
      console.error(error);
    }
  };

  const forgotPasswordClick = () => {
    navigation.navigate('ForgotPassword');
  };

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
          placeHolder={'Email'}
          text={emailInput}
          setText={setEmail}
          validationRegex={emailRegex}
          errorMessage={'Must be an exeter.ac.uk email'}
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
    </SafeAreaView>
  );
};

export default SignInScreen;
