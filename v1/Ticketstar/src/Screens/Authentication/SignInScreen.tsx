import React, {useState, useEffect} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from "@react-navigation/native";

const SignInScreen = () => {
  const navigation = useNavigation();
  const [emailInput, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

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
        'https://lmedajqatl.execute-api.eu-west-2.amazonaws.com/Prod/SignIn',
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
    <View style={styles.container}>
      <TextInput
        style={styles.input}
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
        style={styles.input}
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
            ? styles.button
            : styles.buttonDisabled
        }
        onPress={onSubmit}
        disabled={!(isEmailValid && isPasswordValid)}
        testID="signInButton">
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.registerButton}
        onPress={registerClick}
        testID="registerButton"
      >
        <Text style={styles.registerButtonText}>
          Don't have an account? Register
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
  buttonDisabled: {
    // ...copy other styles from 'button'
    width: '80%',
    padding: 12,
    margin: 8,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: 'lightgrey',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  registerButton: {
    marginTop: 8,
  },
  registerButtonText: {
    color: '#3f51b5',
    textDecorationLine: 'underline',
  },
});

export default SignInScreen;
