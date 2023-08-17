import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  confirmPlatformPayPayment,
  isPlatformPaySupported,
  PlatformPay,
  PlatformPayButton,
  presentPaymentSheet,
  initPaymentSheet,
} from "@stripe/stripe-react-native";
import {API_URL_PROD, API_URL_LOCAL} from '@env';
import { loadPurchases } from "../../Dataloaders";

export default function PaymentScreen({ navigation, route }) {

  // const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;
  const apiUrl = API_URL_PROD;

  const { price, askId, reserveTimeout, eventName, ticketName } = route.params;

  const [isApplePaySupported, setIsApplePaySupported] = useState(false);
  const [loading, setLoading] = useState(false);

  const [paymentIntent, setPaymentIntent] = useState(null);
  const [ephemeralKey, setEphemeralKey] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const calculateTimeRemaining = () => {
    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(reserveTimeout - currentTime, 0);
  };

  const getDisplayTime = (timeRemaining) => {
    const minutes = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
    const seconds = (timeRemaining % 60).toString().padStart(2, '0');
    return `${minutes} minutes, ${seconds} seconds`;
  };

  const [countdown, setCountdown] = useState(getDisplayTime(calculateTimeRemaining()));

  useEffect(() => {
    fetchPaymentSheetParams();
    let timer;

    timer = setInterval(() => {
      const timeLeft = calculateTimeRemaining();

      if (timeLeft <= 0) {
        clearInterval(timer); // Clear the interval if the time has expired.
        navigation.goBack();
        Alert.alert('Timeout', 'Reservation timeout reached.');
      } else {
        setCountdown(getDisplayTime(timeLeft));
      }
    }, 1000);

    // Clean up the timer on component unmount
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    (async function() {
      setIsApplePaySupported(await isPlatformPaySupported());
    })();
  }, []);

  const fetchPaymentSheetParams = async () => {
    setLoading(true);
    const email = await AsyncStorage.getItem('email');
    const first_name = await AsyncStorage.getItem('first_name');
    const surname = await AsyncStorage.getItem('surname');
    const user_id = await AsyncStorage.getItem('user_id');

    const name = first_name + ' ' + surname;

    try {
      const response = await fetch(`${apiUrl}/payment-sheet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price: price,
          user_email: email,
          user_name: name,
          user_id: user_id,
          ask_id: askId,
        }),
      });

      const response_data = await response.json();

      const { paymentIntent, ephemeralKey, customer } = response_data;

      setPaymentIntent(paymentIntent);
      setEphemeralKey(ephemeralKey);
      setCustomer(customer);
      setLoaded(true);

    } catch (error) {
      console.error(error);
      Alert.alert('Network Error', 'Failed to fetch payment sheet params.');
    }
    setLoading(false);
  };

  const openPaymentSheet = async () => {

    const { error } = await presentPaymentSheet();

    if (error) {
      if (error.code === 'Canceled') {
      } else {
        Alert.alert(`Error code: ${error.code}`, error.message);
      }
    } else {
      loadPurchases();
      Alert.alert("Payment Successful", "Thanks for your purchase!", [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
            navigation.navigate('Home', {
              screen: 'MyPurchases',
              params: {
                requestRefresh: true,
              }
            });
          },
        },
      ]);
      // Optionally navigate the user to another screen or perform other actions
    }
  };

  const pay = async () => {
    const { error } = await confirmPlatformPayPayment(
      paymentIntent,
      {
        applePay: {
          cartItems: [
            {
              label: 'Total',
              amount: '12.75',
              paymentType: PlatformPay.PaymentType.Immediate,
            },
          ],
          merchantCountryCode: 'GB',
          currencyCode: 'GBP',
        },
      }
    );
    if (error) {
      console.log(error);
      // handle error
    } else {
      Alert.alert('Success', 'Check the logs for payment intent details.');
      console.log(JSON.stringify(paymentIntent, null, 2));
    }
  };

  const PayByCard = () => {

    const handlePress = async () => {

      await initPaymentSheet({

          merchantDisplayName: 'Ticketstar',
          customerId: customer,
          customerEphemeralKeySecret: ephemeralKey,
          paymentIntentClientSecret: paymentIntent,
          // Set `allowsDelayedPaymentMethods` to true if your business can handle payment
          //methods that complete payment after a delay, like SEPA Debit and Sofort.
          allowsDelayedPaymentMethods: false,
        }
      );

      openPaymentSheet();

    }

    return (
      <TouchableOpacity style={styles.payButton} onPress={handlePress} disabled={!loaded}>
        <Text style={styles.buttonText}>Pay by Card</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Titles and Countdown */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>{eventName}</Text>
        <Text style={styles.subtitleText}>{ticketName}</Text>
        <Text style={styles.countdownText}>Reserved for: {countdown}</Text>
        <Text style={[styles.countdownText, {color: 'black'}]}>Price: £{price}</Text>
      </View>

      {/* Payment Buttons */}
      <View style={styles.paymentContainer}>

        {loading ?
          <ActivityIndicator size="large" color="#0000ff" />
          :
          <>
          <PayByCard/>
            {isApplePaySupported && (<PlatformPayButton
              onPress={pay}
              type={PlatformPay.ButtonType.Pay}
              appearance={PlatformPay.ButtonStyle.Black}
              borderRadius={4}
              style={{
                width: '100%',
                height: 50,
              }}
              disabled={!loaded}
            />)}
          </>
        }
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // This ensures that your container takes up the full screen space
    flexDirection: 'column',
    justifyContent: 'space-between', // This will push titleContainer to the top and paymentContainer to the bottom
  },
  titleContainer: {
    paddingHorizontal: 15, // Horizontal padding for better appearance
    paddingVertical: 20,
    margin: 10,
    backgroundColor: '#f7f7f7',  // Lighter color than the main background color
    borderWidth: 1,
    borderColor: '#e0e0e0',  // Light gray border
    borderRadius: 5,  // Rounded corners
    shadowColor: "#000",  // shadow for iOS
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,// elevation for Android
  },
  paymentContainer: {
    paddingBottom: 20, // Add some padding at the bottom for spacing
    paddingHorizontal: 15, // Give some horizontal padding for better appearance
  },
  payButton: {
    backgroundColor: '#43a047', // Add a background color for the button
    borderRadius: 4,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10, // Add some margin at the bottom for spacing
  },
  buttonText: {
    color: 'white', // Make text color white
    fontWeight: 'bold',
    fontSize: 22,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 20,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  countdownText: {
    fontSize: 18,
    color: '#ff0000', // Red color to signify urgency
    marginBottom: 20,
    textAlign: 'center',
  },
});
