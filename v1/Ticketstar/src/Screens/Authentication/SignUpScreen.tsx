import React, {useEffect, useState} from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';

const SignUpScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState({});

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
        'https://lmedajqatl.execute-api.eu-west-2.amazonaws.com/Prod/SignUp',
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
        console.log(result);
        navigation.navigate('ConfirmVerificationCode', {email});
      } else {
        Alert.alert('Error', result.message || 'An error occurred');
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
    <View style={styles.container}>
      <TextInput
        style={errors.firstName ? styles.inputError : styles.input}
        value={firstName}
        onChangeText={setFirstName}
        placeholder="First Name"
        placeholderTextColor="#888"
      />

      <TextInput
        style={errors.lastName ? styles.inputError : styles.input}
        value={lastName}
        onChangeText={setLastName}
        placeholder="Last Name"
        placeholderTextColor="#888"
      />

      <TextInput
        style={errors.email ? styles.inputError : styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#888"
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <TextInput
        style={errors.password ? styles.inputError : styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry={true}
      />
      {errors.password && (
        <Text style={styles.errorText}>{errors.password}</Text>
      )}

      <TextInput
        style={errors.phoneNumber ? styles.inputError : styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="Phone Number"
        placeholderTextColor="#888"
      />
      {errors.phoneNumber && (
        <Text style={styles.errorText}>{errors.phoneNumber}</Text>
      )}

      <TouchableOpacity
        style={
          Object.keys(errors).length > 0 ? styles.buttonDisabled : styles.button
        }
        onPress={onSubmit}
        disabled={Object.keys(errors).length > 0}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signInButton} onPress={signInClick}>
        <Text style={styles.signInButtonText}>
          Already have an account? Sign In
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  input: {
    width: '80%',
    padding: 12,
    margin: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  button: {
    width: '80%',
    padding: 12,
    margin: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#3f51b5',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  signInButton: {
    marginTop: 8,
  },
  signInButtonText: {
    color: '#3f51b5',
    textDecorationLine: 'underline',
  },
  inputError: {
    width: '80%',
    padding: 12,
    margin: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ff0000',
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#ff0000',
    marginVertical: 5,
    backgroundColor: '#ffe5e5',
    borderRadius: 5,
    padding: 5,
    borderWidth: 1,
    borderColor: '#ffcccc',
    textAlign: 'left',
    width: '80%',
    alignSelf: 'center',
  },
  buttonDisabled: {
    width: '80%',
    padding: 12,
    margin: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#cccccc',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default SignUpScreen;
