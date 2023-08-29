import React, {useState} from 'react';
import {API_URL_PROD} from '@env';
import {
  View,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Text, TouchableOpacity, Linking
} from "react-native";
import Logo from './Logo';
import FinePrintButton from './FinePrintButton';
import CustomButton from './CustomButton';
import InputField from './InputField';
import {BackButton} from '../BackButton';
import {MainColour} from '../../OverallStyles';
import CheckBox from "@react-native-community/checkbox";

const nameValidation = /^.{2,}$/;

const emailValidation = /^[^\s@]+@exeter\.ac\.uk$/;

const AgreementBox = ({ textParts, links, consentValue, setConsentValue, required }) => {
  const handlePress = (url) => {
    Linking.openURL(url);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',  // Align to the top
        justifyContent: 'center',
        width: '75%',
        marginBottom: 10,
      }}>
      <View style={{flex: 0.1, justifyContent: 'center'}}>
        <CheckBox
          value={consentValue}
          onValueChange={setConsentValue}
        />
      </View>
      <View style={{ marginLeft: 10, flex: 0.9, justifyContent: 'center' }}>
        <Text style={{color: required ? 'red': 'black', fontWeight: required ? 'bold': 'normal'}}>
          {textParts.map((part, index) => (
            links[index] ?
              <Text key={index}>
                <Text onPress={() => handlePress(links[index])} style={{ textDecorationLine: 'underline' }}>
                  {part}
                </Text>
              </Text>
              :
              <Text key={index}>{part}</Text>
          ))}
        </Text>
      </View>
    </View>
  );
};



const passwordValidation =
  /^(?!\s+)(?!.*\s+$)(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[$^*.[\]{}()?"!@#%&/\\,><':;|_~`=+\- ])[A-Za-z0-9$^*.[\]{}()?"!@#%&/\\,><':;|_~`=+\- ]{8,256}$/;

const SignUpScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [isFirstNameValid, setIsFirstNameValid] = useState(false);
  const [isLastNameValid, setIsLastNameValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(true);

  const [hasTermsConsent, setHasTermsConsent] = useState(false);
  const [hasMarketingConsent, setHasMarketingConsent] = useState(false);

  const [loading, setLoading] = useState(false);

  const apiUrl = API_URL_PROD;

  const onSubmit = async () => {
    const userData = {
      email,
      password,
      firstName,
      lastName,
      hasTermsConsent,
      hasMarketingConsent,
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

  const handleConfirmChange = text => {
    setConfirmPassword(text);
    if (password !== text){
      console.log(false);
      setIsConfirmPasswordValid(false);
    } else {
      setIsConfirmPasswordValid(true);
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
        }}>
        <BackButton navigation={navigation} params={'MainPage'} />

        <Logo />

        {loading ? (
          <ActivityIndicator size="large" color={MainColour} />
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
              <InputField
                placeHolder={'Confirm Password'}
                text={confirmPassword}
                setText={handleConfirmChange}
                errorMessage={'Passwords do not match'}
                secureEntry={true}
                custom_error={!isConfirmPasswordValid}
              />
            </View>

            <AgreementBox
              textParts={['I agree to receive marketing and promotional emails']}
              links={[null]}
              consentValue={hasMarketingConsent}
              setConsentValue={setHasMarketingConsent}
            />

            <AgreementBox
              textParts={['I agree to the ', 'Terms of Service', ' and ', 'Privacy Policy']}
              links={[null, 'https://ticketstar.uk/terms-of-service', null, 'https://ticketstar.uk/privacy-policy']}
              consentValue={hasTermsConsent}
              setConsentValue={setHasTermsConsent}
              required={!hasTermsConsent}
            />

            <CustomButton
              title={'Sign Up'}
              disabled={
                !(
                  isFirstNameValid &&
                  isLastNameValid &&
                  isEmailValid &&
                  isPasswordValid &&
                  isConfirmPasswordValid &&
                    hasTermsConsent
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
