import AsyncStorage from "@react-native-async-storage/async-storage";
import {API_URL_LOCAL, API_URL_PROD} from '@env';
import { SignOut } from "./SignOut";
import { Alert } from "react-native";

export const CheckAccountEnabled = async navigation => {
  try {
    const apiURL = __DEV__ ? API_URL_LOCAL : API_URL_PROD;
    const userID = await AsyncStorage.getItem('user_id');

    if (userID === null) {
      return
    }

    const response = await fetch(apiURL + '/authentication/CheckAccountEnabled', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'user_id': userID,
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    if (!data.enabled){
      await SignOut(navigation);
      Alert.alert('You have been signed out', 'Please sign in again');
    }
  } catch (error) {
    console.error('Error checking account:', error);
    throw error;
  }
};
