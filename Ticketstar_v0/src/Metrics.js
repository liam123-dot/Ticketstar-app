import {React} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_URL_PROD} from '@env';

export const RecordAppOpen = async () => {
  const userId = await AsyncStorage.getItem('user_id');
  const apiUrl = API_URL_PROD;

  console.log('recording');

  if (userId === null) {
    return;
  }

  fetch(`${apiUrl}/metrics/startsession`, {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
    }),
  });
};
