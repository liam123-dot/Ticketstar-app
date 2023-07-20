import React, {useEffect, useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_URL_PROD, API_URL_LOCAL} from '@env';
import { CommonActions } from "@react-navigation/native";
function PostAskScreen({navigation, route}) {

  const {
    fixr_ticket_id,
    fixr_event_id,
    ticket_name,
    event_name,
    ticket_verified,
    ask_id,
    current_price,
  } = route.params;

  const [transferUrl, setTransferUrl] = useState('');
  const [ticketVerified, setTicketVerified] = useState(ticket_verified);
  const [price, setPrice] = useState('');
  const [userId, setUserId] = useState(null);

  const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;

  useEffect(() => {
    const getUserId = async () => {
      const userId = await AsyncStorage.getItem('user_id');

      setUserId(userId);
    };

    getUserId();
  }, []);

  const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;

  const verifyTransferUrl = async () => {
    console.log(`${fixr_event_id} ${fixr_ticket_id}`);
    const response = await fetch(apiUrl + '/transfers/verifyurl', {
      method: 'POST',
      body: JSON.stringify({
        transfer_url: transferUrl,
        fixr_event_id: fixr_event_id,
        fixr_ticket_id: fixr_ticket_id,
      }),
    });

    if (response.status === 200) {
      setTicketVerified(true);
    } else {
      const data = await response.json();
      console.log(data);
    }
  };

  const handleSubmit = async () => {

    let response;

    if (ticket_verified){
      response = await fetch(apiUrl + '/listing', {
        method: 'PUT',
        body: JSON.stringify({
          ask_id: ask_id,
          price: price,
        }),
      });

    } else {
      response = await fetch(apiUrl + '/listing', {
        method: 'POST',
        body: JSON.stringify({
          fixr_ticket_id: fixr_ticket_id,
          fixr_event_id: fixr_event_id,
          transfer_url: transferUrl,
          price: price,
          user_id: userId,
        }),
      });
    }

    if (response.status === 200) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: 'MyListings' },
          ],
        })
      );
    } else {
      const data = await response.json();
      console.log(data);
    }
  };

  const handleDelete = async () => {

    const response = await fetch(apiUrl + '/listing', {
      method: 'DELETE',
      body: JSON.stringify({
        ask_id: ask_id,
      }),
    });

    if (response.status !== 200){
      const data = await response.json();
      console.error(data);
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: 'MyListings' },
          ],
        })
      );
    }

  };

  function isNumber(n: any): boolean {
    return !isNaN(parseFloat(n)) && !isNaN(n - 0);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{event_name}</Text>
      <Text style={styles.subtitle}>{ticket_name}</Text>

      {ticket_verified ? (
        <Text style={styles.currentPriceText}>
          Current price: £{current_price}
        </Text>
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Transfer URL"
            placeholderTextColor="#888"
            value={transferUrl}
            onChangeText={setTransferUrl}
            editable={!ticketVerified}
          />

          <TouchableOpacity
            style={[
              styles.button,
              styles.verifyButton,
              {
                backgroundColor: urlRegex.test(transferUrl)
                  ? '#3f51b5'
                  : 'lightgrey',
              },
            ]}
            onPress={verifyTransferUrl}
            disabled={!urlRegex.test(transferUrl) || ticketVerified}>
            <Text style={[styles.buttonText, {color: 'white'}]}>
              {ticketVerified ? 'Verified!' : 'Verify'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoButton}
            onPress={() =>
              Alert.alert(
                'Verify Ticket Ownership',
                'Enter the transfer url for the event so we can verify its validity',
              )
            }>
            <Text style={styles.infoButtonText}>?</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Price (£)"
          placeholderTextColor="#888"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          styles.submitButton,
          {
            backgroundColor:
              ticketVerified && isNumber(price) ? '#4CAF50' : 'lightgrey',
          },
        ]}
        onPress={handleSubmit}
        disabled={!ticketVerified || !isNumber(price)}>
        <Text style={[styles.buttonText, styles.submitButtonText]}>Submit</Text>
      </TouchableOpacity>

      {ticket_verified ? (
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={[styles.buttonText, styles.deleteButtonText]}>
            Delete
          </Text>
        </TouchableOpacity>
      ) : (
        <></>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#555',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
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
  verifyButton: {
    backgroundColor: '#3f51b5',
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#4CAF50',
  },
  submitButtonText: {
    fontSize: 18,
  },
  deleteButton: {
    marginVertical: 10,
    width: '100%',
    backgroundColor: '#e53935',
  },
  deleteButtonText: {
    fontSize: 18,
  },
  currentPriceText: {
    fontSize: 16,
    marginBottom: 16,
    color: '#555',
  },
  infoButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3f51b5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  infoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PostAskScreen;
