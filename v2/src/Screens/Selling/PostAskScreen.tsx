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
  const [real_ticket_id, setReal_ticket_id] = useState(null);

  useEffect(() => {
    const getUserId = async () => {
      const userId = await AsyncStorage.getItem('user_id');

      setUserId(userId);
    };

    getUserId();
  }, []);

  const handleVerifyTransferUrl = () => {
    fetch('http://127.0.0.1:3000/VerifyTicketTransferUrl', {
      method: 'POST',
      body: JSON.stringify({
        transfer_url: transferUrl,
        fixr_ticket_id: fixr_ticket_id,
        fixr_event_id: fixr_event_id,
        user_id: userId,
      }),
    })
      .then(async response => {
        if (response.ok) {
          // 2xx status code, verification successful
          setTicketVerified(true);

          let data = await response.json();

          console.log(data);

          setReal_ticket_id(data.real_ticket_id);

          Alert.alert(
            'Verification Successful',
            'Your transfer URL has been successfully verified!',
          );
        } else {
          let data = await response.json()
          console.log(data)
          // Non-2xx status code, verification failed
          Alert.alert(
            'Verification Failed',
            'The provided transfer URL could not be verified. Please check it and try again.',
          );
        }
      })
      .catch(error => {
        // Handle network errors
        console.error('Error:', error);
        Alert.alert(
          'Error',
          'An error occurred while verifying the transfer URL. Please try again.',
        );
      });
  };

  const handleSubmit = async () => {
    // Logic for submitting the data

    const user_id = await AsyncStorage.getItem('user_id');
    console.log(real_ticket_id);

    fetch('http://127.0.0.1:3000/Asks', {
      method: ticket_verified ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: ticket_verified
        ? JSON.stringify({
            user_id,
            price,
            ask_id,
          })
        : JSON.stringify({
            user_id,
            price,
            fixr_ticket_id,
            fixr_event_id,
            real_ticket_id,
          }),
    })
      .then(response => {
        // Check if the status code is in the 2xx range
        if (response.ok) {
          return response.json();
        } else {
          // First read the response body, then throw an error
          return response.json().then(errorBody => {
            throw new Error(
              `Server responded with a status of ${
                response.status
              } with error ${JSON.stringify(errorBody)}`,
            );
          });
        }
      })
      .then(data => {
        // Handle the response data for 2xx status code

        console.log('Success:', data);

        navigation.navigate('Search');
      })
      .catch(error => {
        // Handle errors (this could be network errors or non-2xx status codes)
        console.error('Error:', error);
      });
  };

  const handleDelete = async () => {
    fetch('http://127.0.0.1:3000/Asks', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ask_id,
      }),
    }).then(response => {
      if (response.ok) {
        Alert.alert('Listing successfully deleted');
        navigation.navigate('MyListings');
      }
    });
  };

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
          />

          <TouchableOpacity
            style={[
              styles.button,
              styles.verifyButton,
              {backgroundColor: ticketVerified ? '#4CAF50' : '#3f51b5'},
            ]}
            onPress={handleVerifyTransferUrl}
            disabled={ticketVerified}>
            <Text
              style={[
                styles.buttonText,
                {color: ticketVerified ? 'white' : 'white'},
              ]}>
              {ticketVerified ? 'Verified!' : 'Verify'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoButton}
            onPress={() =>
              Alert.alert(
                'Verify Ticket Ownership',
                'Enter the transfer url for the event, we will use our accounts to verify it. If you cancel your sale you can easily receive a link to reclaim your ticket.',
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
          {backgroundColor: ticketVerified ? '#4CAF50' : 'lightgrey'},
        ]}
        onPress={handleSubmit}
        disabled={!ticketVerified}>
        <Text style={[styles.buttonText, styles.submitButtonText]}>Submit</Text>
      </TouchableOpacity>

      {ticket_verified ? (
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={handleDelete}>
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
