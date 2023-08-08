import {API_URL_PROD, API_URL_LOCAL} from '@env';
import {Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const loadListings = async () => {
  const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;
  const userID = await AsyncStorage.getItem('user_id');

  const response = await fetch(`${apiUrl}/listings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: userID,
    },
  });

  if (!response.ok) {
    Alert.alert('There has been a network error');
    const data = await response.json();
  } else {
    let data = await response.json();
    data = data.info;
    if (data != null) {
      const expandedData = Object.keys(data).map(eventId => ({
        ...data[eventId],
        isExpanded: false,
        tickets: Object.keys(data[eventId].tickets).map(ticketId => ({
          ...data[eventId].tickets[ticketId],
          isExpanded: false,
        })),
      }));
      console.log('expanded data: ' + expandedData);
      await AsyncStorage.setItem('UserListings', JSON.stringify(expandedData));
    }
  }
};

export const loadPurchases = async () => {
  const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;
  const userID = await AsyncStorage.getItem('user_id');

  const response = await fetch(`${apiUrl}/purchases`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: userID,
    },
  });
  if (!response.ok) {
    Alert.alert('There has been a network error');
    const data = await response.json();
    console.log(JSON.stringify(data, null, 4));
  } else {
    let data = await response.json();
    data = data.info;
    if (data != null) {
      const expandedData = Object.keys(data).map(eventId => ({
        ...data[eventId],
        isExpanded: false,
        tickets: Object.keys(data[eventId].tickets).map(ticketId => ({
          ...data[eventId].tickets[ticketId],
          isExpanded: false,
        })),
      }));

      await AsyncStorage.setItem('UserPurchases', JSON.stringify(expandedData));
    }
  }
};
