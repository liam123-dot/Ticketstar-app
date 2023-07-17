import React, {useState, useEffect} from 'react';
import { API_URL_PROD } from '@env'
import {
  View,
  TextInput,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {authenticationStyles} from "../Styling/authentication";

const SignInScreen = () => {
  const navigation = useNavigation();
  const [emailInput, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

  const apiUrl = API_URL_PROD;

  useEffect(() => {
    checkUserExistence();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setEmail('');
      setPassword('');
      setIsEmailValid(false);
      setIsPasswordValid(false);
    }, []),
  );

  const checkUserExistence = async () => {
    try {
      const user_id = await AsyncStorage.getItem('user_id');
      if (user_id) {
        // User exists, navigate to the home screen
        navigation.navigate('Home', {
          screen: 'HomeTabs',
          params: {
            screen: 'Search',
          },
        });
      }
    } catch (error) {
      console.error('Error checking user existence:', error);
    }
  };

  const onSubmit = async () => {
    try {
      const response = await fetch(
          (apiUrl + '/authentication/signin'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({email: emailInput, password}),
        },
      );

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

  const registerClick = () => {
    navigation.navigate('SignUp');
  };

  return (
    <View style={authenticationStyles.container}>
      <TextInput
        style={authenticationStyles.input}
        value={emailInput}
        placeholder="Email"
        placeholderTextColor="#888"
        onChangeText={text => {
          setEmail(text);
          setIsEmailValid(emailRegex.test(text));
        }}
        testID="emailInput"
      />
      <TextInput
        style={authenticationStyles.input}
        value={password}
        onChangeText={text => {
          setPassword(text);
          setIsPasswordValid(text.length > 5);
        }}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry={true}
        testID="passwordInput"
      />
      <TouchableOpacity
        style={
          isEmailValid && isPasswordValid
            ? authenticationStyles.button
            : authenticationStyles.buttonDisabled
        }
        onPress={onSubmit}
        disabled={!(isEmailValid && isPasswordValid)}
        testID="signInButton">
        <Text style={authenticationStyles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={authenticationStyles.registerButton}
        onPress={registerClick}
        testID="registerButton"
      >
        <Text style={authenticationStyles.registerButtonText}>
          Don't have an account? Register
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignInScreen;
