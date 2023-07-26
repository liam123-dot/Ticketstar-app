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
import {CommonActions} from '@react-navigation/native';
function PostAskScreen({navigation, route}) {
  const {
    fixr_ticket_id,
    fixr_event_id,
    ticket_name,
    event_name,
    ticket_verified,
    ask_id,
    current_price,
    reserve_timeout,
  } = route.params;

  const [transferUrl, setTransferUrl] = useState('');
  const [ticketVerified, setTicketVerified] = useState(ticket_verified);
  const [price, setPrice] = useState('');
  const [userId, setUserId] = useState(null);

  const [countdownTime, setCountdownTime] = useState(reserve_timeout - Math.floor(Date.now() / 1000));
  const [countdownActive, setCountdownActive] = useState(false);

  const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;

  const handlePriceChange = (price: string) => {
    let decimalPrice: string;

    // Remove £ if present
    if (price.includes("£")) {
      decimalPrice = price.slice(1);
    } else {
      decimalPrice = price;
    }

    // Check if price has more than 1 decimal place
    let decimalIndex = decimalPrice.indexOf('.');
    if (decimalIndex !== -1 && decimalIndex < decimalPrice.length - 2) {
      // Price has more than one decimal place, so limit it to one decimal place
      decimalPrice = decimalPrice.slice(0, decimalIndex + 2);
    }

    // Append £ to the price
    setPrice("£" + decimalPrice);
  }


  useEffect(() => {
    const getUserId = async () => {
      const userId = await AsyncStorage.getItem('user_id');

      setUserId(userId);
    };

    getUserId();
  }, []);

  useEffect(() => {
    if (ticket_verified) {
      setCountdownActive(true);
    }
  }, [ticket_verified]);

  useEffect(() => {
    let intervalId;

    if (countdownActive && countdownTime > 0) {
      intervalId = setInterval(() => {
        setCountdownTime(prevTime => prevTime - 1);
      }, 1000);
    } else if (countdownActive && countdownTime <= 0) {
      navigation.goBack();
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    }
  }, [countdownActive, countdownTime]);

  const countdownMin = Math.floor(countdownTime / 60);
  const countdownSec = countdownTime % 60;

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
      Alert.alert("Invalid transfer url for this event")
      const data = await response.json();
      console.log(data);
    }
  };

  const handleSubmit = async () => {
    let response;

    if (ticket_verified) {
      response = await fetch(apiUrl + '/listing', {
        method: 'PUT',
        body: JSON.stringify({
          ask_id: ask_id,
          price: price.slice(1, price.length),
        }),
      });
    } else {
      response = await fetch(apiUrl + '/listing', {
        method: 'POST',
        body: JSON.stringify({
          fixr_ticket_id: fixr_ticket_id,
          fixr_event_id: fixr_event_id,
          transfer_url: transferUrl,
          price: price.slice(1, price.length),
          user_id: userId,
        }),
      });
    }

    if (response.ok) {
      Alert.alert('Listing successfully posted');
      navigation.goBack();
      navigation.navigate("MyListings")
    } else {
      try {
        const data = await response.json();
        if (data.reason === 'TransferURL'){
          Alert.alert(data.message);
          setTicketVerified(false);
        }
      } catch (e) {
        console.log('Error parsing response', e);
      }
    }
  };

  const handleDelete = async () => {
    const response = await fetch(apiUrl + '/listing', {
      method: 'DELETE',
      body: JSON.stringify({
        ask_id: ask_id,
      }),
    });

    if (response.status !== 200) {
      const data = await response.json();
      console.error(data);
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'MyListings'}],
        }),
      );
    }
  };

  function isNumber(n: any): boolean {
    n = n.slice(1, n.length);
    return !isNaN(parseFloat(n)) && !isNaN(n - 0);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{event_name}</Text>
      <Text style={styles.subtitle}>{ticket_name}</Text>

      {ticket_verified ? (
        <Text style={styles.currentPriceText}>
          Current price: £{current_price}
          Time to edit: {countdownMin}:{countdownSec < 10 ? '0' : ''}{countdownSec}
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
                'Enter the transfer url for the event so we can verify its validity, once you press submit we will take the ticket into our account. You can easily reclaim ticket from listings page if you change your mind.',
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
          onChangeText={handlePriceChange}
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
