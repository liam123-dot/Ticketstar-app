import React, {useEffect, useState} from 'react';
import { API_URL_PROD } from '@env'
import {
  View,
  TextInput,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import {authenticationStyles} from "../Styling/authentication";

const SignUpScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState({});

  const apiUrl = API_URL_PROD;

  console.log(apiUrl)

  useEffect(() => {
    const errors = {};

    if (firstName.length < 2) {
      errors.firstName = 'error';
    }
    if (lastName.length < 2) {
      errors.lastName = 'error';
    }

    const passwordValidation =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!password.match(passwordValidation)) {
      errors.password =
        'Password requirements:\n8 characters\nAt least one uppercase character\nAt least one number\nAt least one special character';
    }

    const emailValidation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.match(emailValidation)) {
      errors.email = 'Please enter a valid email';
    }

    const phoneValidation = /^\+44\d{10}$/;
    if (!phoneNumber.match(phoneValidation)) {
      errors.phoneNumber =
        'Please enter a valid British phone number starting with +44';
    }

    setErrors(errors);
  }, [firstName, lastName, email, password, phoneNumber]);
  const onSubmit = async () => {
    const userData = {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
    };

    try {
      const response = await fetch(
          (apiUrl + '/authentication/signup'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        },
      );

      const result = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Registration successful');
        navigation.navigate('ConfirmVerificationCode', {email});
      } else {
        if (response.status == 401){
          Alert.alert(result.message)
        } else {
          console.log(result)
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while registering');
      console.error(error);
    }
  };

  const signInClick = () => {
    navigation.navigate('SignIn');
  };

  return (
    <View style={authenticationStyles.container}>
      <TextInput
        style={errors.firstName ? authenticationStyles.inputError : authenticationStyles.input}
        value={firstName}
        onChangeText={setFirstName}
        placeholder="First Name"
        placeholderTextColor="#888"
      />

      <TextInput
        style={errors.lastName ? authenticationStyles.inputError : authenticationStyles.input}
        value={lastName}
        onChangeText={setLastName}
        placeholder="Last Name"
        placeholderTextColor="#888"
      />

      <TextInput
        style={errors.email ? authenticationStyles.inputError : authenticationStyles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#888"
      />
      {errors.email && <Text style={authenticationStyles.errorText}>{errors.email}</Text>}

      <TextInput
        style={errors.password ? authenticationStyles.inputError : authenticationStyles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry={true}
      />
      {errors.password && (
        <Text style={authenticationStyles.errorText}>{errors.password}</Text>
      )}

      <TextInput
        style={errors.phoneNumber ? authenticationStyles.inputError : authenticationStyles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="Phone Number"
        placeholderTextColor="#888"
      />
      {errors.phoneNumber && (
        <Text style={authenticationStyles.errorText}>{errors.phoneNumber}</Text>
      )}

      <TouchableOpacity
        style={
          Object.keys(errors).length > 0 ? authenticationStyles.buttonDisabled : authenticationStyles.button
        }
        onPress={onSubmit}
        disabled={Object.keys(errors).length > 0}>
        <Text style={authenticationStyles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity style={authenticationStyles.signInButton} onPress={signInClick}>
        <Text style={authenticationStyles.signInButtonText}>
          Already have an account? Sign In
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignUpScreen;
