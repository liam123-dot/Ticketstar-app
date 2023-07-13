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
import {useStripe} from '@stripe/stripe-react-native';

function BuyingScreen({navigation, route}) {
  const {ticket_name, event_name, ask_id, price, reserve_timeout} =
    route.params;

  const {initPaymentSheet, presentPaymentSheet} = useStripe();
  const [loading, setLoading] = useState(false);

  const [timeout, setTimeout] = useState(reserve_timeout);
  const [timer, setTimer] = useState('Calculating...');

  const fetchPaymentSheetParams = async () => {
    const email = await AsyncStorage.getItem('email');
    const first_name = await AsyncStorage.getItem('first_name');
    const surname = await AsyncStorage.getItem('surname');
    const phone_number = await AsyncStorage.getItem('phone_number');
    const user_id = await AsyncStorage.getItem('user_id');

    const name = first_name + ' ' + surname;

    const response = await fetch(
      'http://127.0.0.1:3000/Payment/payment-sheet',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price: price,
          user_email: email,
          user_phone_number: phone_number,
          user_name: name,
          user_id: user_id,
        }),
      },
    );

    const response_data = await response.json();

    console.log(response_data);

    const {paymentIntent, ephemeralKey, customer} = response_data;

    return {
      paymentIntent,
      ephemeralKey,
      customer,
    };
  };

  const initializePaymentSheet = async () => {
    const {paymentIntent, ephemeralKey, customer, publishableKey} =
      await fetchPaymentSheetParams();

    const {error} = await initPaymentSheet({
      merchantDisplayName: 'Ticketstar',
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: paymentIntent,
      // Set `allowsDelayedPaymentMethods` to true if your business can handle payment
      //methods that complete payment after a delay, like SEPA Debit and Sofort.
      allowsDelayedPaymentMethods: true,
      defaultBillingDetails: {
        name: 'Jane Doe',
      },
    });
    if (!error) {
      setLoading(true);
    }
  };

  const openPaymentSheet = async () => {
    const {error} = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message);
    } else {
      Alert.alert('Success', 'Your order is confirmed!');
      navigation.reset({
        index: 0,
        routes: [{name: 'MyPurchases'}],
      });

      fetch('http://127.0.0.1:3000/Asks/Fulfill', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ask_id: ask_id,
        }),
      })
        .then(async response => {
          if (!response.ok) {
            throw new Error('HTTP status ' + response.status);
          }
          return response.json();
        })
        .then(() => {})
        .catch(error => {
          // Handle network errors.
          console.error(error);
        });
    }
  };

  const cancelReservation = async () => {
    fetch('http://127.0.0.1:3000/Asks/Reserve', {
      method: 'DELETE',
      body: JSON.stringify({
        ask_id: ask_id,
      }),
    });
  };

  useEffect(() => {
    initializePaymentSheet();
  }, []); // Dependencies for the payment initialization

  useEffect(() => {
    // Countdown timer
    let countdown = setInterval(() => {
      const currentTime = Math.floor(Date.now() / 1000);
      const diff = timeout - currentTime;
      if (diff <= 0) {
        clearInterval(countdown);
        setTimer('Timeout!');

        cancelReservation();

        navigation.goBack();
      } else {
        let minutes = Math.floor(diff / 60);
        let seconds = diff % 60;
        setTimer(`${minutes} Minutes ${seconds} Seconds`);
      }
    }, 1000);

    return () => clearInterval(countdown); // Cleanup
  }, []); // Dependencies for the countdown timer

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{event_name}</Text>
      <Text style={styles.subtitle}>{ticket_name}</Text>

      <Text style={styles.currentPriceText}>Current price: £{price}</Text>

      <Text style={styles.timer}>Ticket reserved for: {timer}</Text>

      <TouchableOpacity
        style={[
          styles.button,
          styles.submitButton,
          {backgroundColor: loading ? '#4CAF50' : 'lightgrey'},
        ]}
        onPress={openPaymentSheet}
        disabled={!loading}>
        <Text style={[styles.buttonText, styles.submitButtonText]}>
          Checkout
        </Text>
      </TouchableOpacity>
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
  time: {
    fontSize: 14,
    marginBottom: 16,
    color: '#555',
  },
});

export default BuyingScreen;
