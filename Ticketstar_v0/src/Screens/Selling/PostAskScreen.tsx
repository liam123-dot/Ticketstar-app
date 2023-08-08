import React, {useEffect, useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert, ScrollView, RefreshControl
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_URL_PROD, API_URL_LOCAL} from '@env';
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
  const [price, setPrice] = useState('£');
  const [userId, setUserId] = useState(null);

  const [countdownTime, setCountdownTime] = useState(
    reserve_timeout - Math.floor(Date.now() / 1000),
  );
  const [countdownActive, setCountdownActive] = useState(false);

  const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;

  const [pricingID, setPricingID] = useState(null);
  const [stripeFixedFee, setStripeFixedFee] = useState(0);
  const [stripeVariableFee, setStripeVariableFee] = useState(0);
  const [platformFixedFee, setPlatformFixedFee] = useState(0);
  const [platformVariableFee, setPlatformVariableFee] = useState(0);
  const [havePlatformFee, setHavePlatformFee] = useState(false);

  const [areFeesLoaded, setAreFeesLoaded] = useState(false);

  const [platformFee, setPlatformFee] = useState(0);
  const [stripeFee, setStripeFee] = useState(0);
  const [sellerReceives, setSellerReceives] = useState(0);

  const [loading, setLoading] = useState(false);
  const [invalidPrice, setInvalidPrice] = useState(false);

  console.log(fixr_ticket_id, fixr_event_id);

  const fetchPricing = async () => {
    const response = await fetch(`${apiUrl}/fees`, {
      method: 'GET',
    });

    if (response.ok){
      const data = await response.json();

      setPricingID(data.pricing_id);
      setStripeFixedFee(data.stripe_fixed_fee);
      setStripeVariableFee(data.stripe_variable_fee);
      setPlatformFixedFee(data.platform_fixed_fee);
      setPlatformVariableFee(data.platform_variable_fee);
      setAreFeesLoaded(true);

      if (data.platform_fixed_fee + data.platform_variable_fee > 0){
        setHavePlatformFee(true);
      }

    } else {
      Alert.alert('Issue loading pricing, please try again');
      navigation.goBack();
    }
  };

  const updateFees = (price) => {
    if (price === '£' || price.length === 0){
      setStripeFee(0);
      setPlatformFee(0);
      setSellerReceives(0);
    } else {
      const numericPrice = Number(price.slice(1));
      let platform_fee = Number((platformFixedFee / 100 + numericPrice * platformVariableFee).toFixed(2));
      let stripe_fee = Number((stripeFixedFee / 100 + numericPrice * stripeVariableFee).toFixed(2));

      let seller_receives = numericPrice - (platform_fee + stripe_fee);

      setPlatformFee(platform_fee.toFixed(2));
      setStripeFee(stripe_fee.toFixed(2));
      setSellerReceives(seller_receives.toFixed(2));
    }
  };

  const handlePriceChange = (price: string) => {
    let decimalPrice: string;

    // Remove £ if present
    if (price.includes('£')) {
      decimalPrice = price.slice(1);
    } else {
      decimalPrice = price;
    }

    try {
      if (parseFloat(decimalPrice) < 0.2) {
        setInvalidPrice(true);
      } else {
        setInvalidPrice(false);
      }

      // Check if price has more than 1 decimal place
      let decimalIndex = decimalPrice.indexOf('.');
      if (decimalIndex !== -1 && decimalIndex < decimalPrice.length - 2) {
        // Price has more than one decimal place, so limit it to one decimal place
        decimalPrice = decimalPrice.slice(0, decimalIndex + 2);
      } else {
        updateFees(price);
      }

      // Append £ to the price
      setPrice('£' + decimalPrice);
    } catch (e) {

    }
  };

  useEffect(() => {
    const getUserId = async () => {
      const userId = await AsyncStorage.getItem('user_id');

      setUserId(userId);
      fetchPricing();
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
    };
  }, [countdownActive, countdownTime]);

  const countdownMin = Math.floor(countdownTime / 60);
  const countdownSec = countdownTime % 60;

  const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;

  const verifyTransferUrl = async () => {
    setLoading(true);
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
      Alert.alert('Invalid transfer url for this event');
      const data = await response.json();
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
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
          pricing_id: pricingID,
        }),
      });
    }

    if (response.ok) {
      Alert.alert('Listing successfully posted', 'You can easily reclaim your ticket from the listings page if you no longer wish to sell it.');
      navigation.goBack();
      navigation.navigate('MyListings');
    } else {
      try {
        const data = await response.json();
        if (data.reason === 'TransferURL') {
          Alert.alert(data.message);
          setTicketVerified(false);
        }
      } catch (e) {
        console.log('Error parsing response', e);

      }
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
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
      navigation.goBack();
      navigation.navigate('MyListings');
    }
    setLoading(false);
  };

  function isNumber(n: any): boolean {
    n = n.slice(1, n.length);
    return !isNaN(parseFloat(n)) && !isNaN(n - 0);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}
    refreshControl={
      // include the RefreshControl component in ScrollView
      <RefreshControl refreshing={loading}/>
    }>
      <Text style={styles.title}>{event_name}</Text>
      <Text style={styles.subtitle}>{ticket_name}</Text>

      {ticket_verified ? (
        <><Text style={styles.currentPriceText}>
          Current price: £{current_price}
        </Text><Text style={styles.currentPriceText}>
          Time to edit: {countdownMin}:{countdownSec < 10 ? "0" : ""}
          {countdownSec}
        </Text></>
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

        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, {
          borderColor: invalidPrice ? 'red': '#ddd'
        }]}
          placeholder="Price (£)"
          placeholderTextColor="#888"
          value={price}
          onChangeText={handlePriceChange}
          keyboardType="numeric"
        />
      </View>

      <View style={{flexDirection: 'row'}}>
        <Text style={styles.feeText}>Payment Processing fee: £{stripeFee}</Text>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() =>
            Alert.alert(
              'Payment Processing Fee',
              havePlatformFee ? 'This is the fee charged by our payment provider Stripe.':
                'This is the fee charged by our payment provider Stripe. We do not currently take a service fee.',
            )
          }>
          <Text style={styles.infoButtonText}>?</Text>
        </TouchableOpacity>
      </View>
      {havePlatformFee > 0 ?
        <Text style={styles.feeText}>Ticketstar fee: £{platformFee}</Text>: <></>}
      <Text style={styles.feeText}>You receive: £{sellerReceives}</Text>

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
        disabled={!ticketVerified || !isNumber(price) || !areFeesLoaded}>
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
    </ScrollView>
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
    marginTop: 20,
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
    width: 25,
    height: 25,
    borderRadius: 15,
    backgroundColor: '#95A1F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  infoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  feeText: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
});

export default PostAskScreen;
