import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Linking } from "react-native";
import {API_URL_LOCAL, API_URL_PROD} from '@env'

const apiUrl = __DEV__ ? API_URL_LOCAL: API_URL_PROD;

export const handleTransfer = async (askId, setRefreshing) => {
  setRefreshing(true);
  const userId = await AsyncStorage.getItem('user_id');
  const response = await fetch(`${apiUrl}/transfers/${askId}`, {
    method: 'POST',
    body: JSON.stringify({
      'user_id': userId,
    })
  });
  const body = await response.json();

  if (response.ok) {
    // Assuming the API response contains a 'transfer_url' field
    const transferUrl = body.transfer_url;
    Linking.openURL(transferUrl);
  } else {
    console.error('Failed to fetch transfer URL: ', body);
    if (body.reason === 'TicketNoLongerAvailable'){
      Alert.alert('Ticket no longer available to claim');
      reload();
    }
  }
  setRefreshing(false);
};
