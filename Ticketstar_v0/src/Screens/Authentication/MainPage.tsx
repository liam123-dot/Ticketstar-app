import React, { useEffect } from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Logo from "./Logo";
import CustomButton from "./CustomButton";
import FinePrintButton from "./FinePrintButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CheckAccountEnabled } from "../../CheckAccountEnabled";

export default function MainPage({navigation}) {

  useEffect(() => {
    CheckAccountEnabled(navigation);
    checkUserExistence();
  }, [])

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

  const handleSignUpPress = () => {

    navigation.navigate("SignUp");

  };

  const handleSignInPress = () => {

    navigation.navigate("SignIn");

  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>

      <Logo/>

      <CustomButton title={"Sign up with email"} handlePress={handleSignUpPress}/>

      <FinePrintButton title={"Existing User? Login Now"} handlePress={handleSignInPress}/>

    </SafeAreaView>
  );
}
