import React, {useState, useEffect, useContext} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {API_URL_PROD, API_URL_LOCAL} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {formatTimes} from '../../utilities';
import {useStripe} from '@stripe/stripe-react-native';

function ListItem({object, onSelect, isSelected}) {
  return (
    <TouchableOpacity
      style={[styles.listItem, isSelected ? styles.selectedListItem : null]}
      onPress={() => onSelect(object.id)}>
      <View style={styles.listItemTextContainer}>
        <Text style={styles.text}>{object.name}</Text>
        {
          object.listing ? (
            <Text style={styles.price}>
              £{(parseFloat(object.listing.ask_price)).toFixed(2)}
            </Text>
          ) : <></>
        }

        {/*{*/}
        {/*  object.listing*/}
        {/*}*/}
        {/*<Text style={[styles.price, styles.text]}>*/}
        {/*  Original Price: £{object.price + object.booking_fee}*/}
        {/*</Text>*/}
        {/* Adding an icon here could be nice */}
      </View>
    </TouchableOpacity>
  );
}

function ListContainer({title, objects, onSelectTicket, selectedTicketId}) {
  return (
    <View style={styles.listContainer}>
      <Text style={styles.listTitle}>{title}</Text>
      {objects && objects.length > 0 ? (
        objects.map(object => (
          <ListItem
            key={object.id}
            object={object}
            onSelect={onSelectTicket}
            isSelected={selectedTicketId === object.id}
          />
        ))
      ) : (
        <Text style={styles.listItem}>
          {objects && objects.length === 0 ? `No ${title}` : 'Search to start'}
        </Text>
      )}
    </View>
  );
}

function EventScreen({route, navigation}) {
  const {fixr_id, name, image_url, venue, open_time, close_time, user_id} =
    route.params;
  const {initPaymentSheet, presentPaymentSheet} = useStripe();

  let apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;

  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [eventData, setEventData] = useState(null);
  const [ticketData, setTicketData] = useState(null);

  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const [buyButtonTitle, setBuyButtonTitle] = useState(
    'Buy - No Ticket Selected',
  );
  const [buyButtonDisabled, setBuyButtonDisabled] = useState(true);
  const [cheapest, setCheapest] = useState(null);
  const [askId, setAskId] = useState(null);
  const [price, setPrice] = useState(null);

  const generatePaymentSheet = async () => {
    await initializePaymentSheet();
    await openPaymentSheet();
  };

  const handleBuyPress = () => {
    const navigate = async () => {
      const response = await fetch(apiUrl + '/listings/reserve', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user_id,
          ask_id: askId,
          price: price,
        }),
      });

      if (response.status === 400) {
        fetchData();
        setSelectedTicketId(null);
        Alert.alert('Ask no longer available');
      } else if (response.status === 200) {
        generatePaymentSheet();
      }
    };

    if (!cheapest) {
      Alert.alert(
        'You are selling this ticket for a lower price',
        'Are you sure you want to continue',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {text: 'Yes', onPress: () => navigate()},
        ],
      );
    } else {
      navigate();
    }
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
      // setIsLoading(true);
    }
  };

  const handleSellPress = () => {
    navigation.navigate('Post Ask', {
      fixr_ticket_id: ticketData[selectedTicketId].fixr_ticket_id,
      fixr_event_id: eventData.fixr_event_id,
      ticket_name: ticketData[selectedTicketId].name,
      event_name: name,
      // Pass the selected ask data
    });
  };

  const initializeData = async () => {
    await fetchData();
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        apiUrl + `/search/event/${fixr_id}?user_id=${user_id}`,
        {method: 'GET'},
      );
      const event_data = await response.json();
      setEventData(event_data);

      let tickets = {};

      if (event_data.tickets) {
        event_data.tickets.forEach(function (ticket) {
          let ticket_info = ticket;
          tickets[ticket.id] = ticket_info;
        });

        setTicketData(tickets);
        console.log(tickets);
      }

      setIsLoading(false);
      resetValues(true);
    } catch (error) {
      console.error(error);
      console.error('Search fetch');
      Alert.alert('Network Error', 'Failed to fetch data.');
      setIsLoading(false);
    }

    setIsLoading(false);
    resetValues(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setSelectedTicketId(null);
    await fetchData();
    setRefreshing(false);
  };

  const fetchPaymentSheetParams = async () => {
    const email = await AsyncStorage.getItem('email');
    const first_name = await AsyncStorage.getItem('first_name');
    const surname = await AsyncStorage.getItem('surname');
    const phone_number = await AsyncStorage.getItem('phone_number');
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
          user_phone_number: phone_number,
          user_name: name,
          user_id: user_id,
          ask_id: askId,
        }),
      });

      const response_data = await response.json();

      const {paymentIntent, ephemeralKey, customer} = response_data;

      return {
        paymentIntent,
        ephemeralKey,
        customer,
      };
    } catch (error) {
      console.error(error);
      Alert.alert('Network Error', 'Failed to fetch payment sheet params.');
    }
  };

  const openPaymentSheet = async () => {
    const {error} = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message);
    } else {
      fetch(`${apiUrl}/listings/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ask_id: askId,
          buyer_user_id: user_id,
        }),
      })
        .then(async response => {
          if (!response.ok) {
            throw new Error('HTTP status ' + response.status);
          }
          return response.json();
        })
        .then(() => {
          Alert.alert('Success', 'Your order is confirmed!');
          navigation.goBack();
          navigation.navigate('MyPurchases');
        })
        .catch(error => {
          // Handle network errors.
          Alert.alert('Unexpected error');
          console.error(error);
        });
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (ticketData) {
      if (ticketData[selectedTicketId]) {
        if (ticketData[selectedTicketId].listing) {
          const listing = ticketData[selectedTicketId].listing;
          const price = listing.ask_price;

          setBuyButtonTitle(`Buy - £${parseFloat(price).toFixed(2)}`);
          setBuyButtonDisabled(false);
          setCheapest(listing.cheapest);
          setAskId(listing.ask_id);
          setPrice(price);
        } else {
          resetValues(false);
        }
      }
    }
  }, [selectedTicketId]);

  const resetValues = refreshing => {
    setBuyButtonTitle(
      refreshing ? 'No Ticket Selected' : 'No Tickets for Sale',
    );
    setBuyButtonDisabled(true);
    setCheapest(null);
    setAskId(null);
    setPrice(null);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <>
            <Text style={styles.title}>{name}</Text>
            <Image
              source={{uri: image_url}}
              style={styles.eventImage}
              PlaceholderContent={<ActivityIndicator />} // A placeholder component for the image
            />
            <Text style={styles.timeText}>
              {formatTimes(open_time, close_time)}
            </Text>
            <Text style={styles.venueText}>{venue}</Text>
            <FlatList // Using FlatList for better performance
              data={eventData?.tickets}
              renderItem={({item}) => (
                <ListItem
                  object={item}
                  onSelect={setSelectedTicketId}
                  isSelected={selectedTicketId === item.id}
                />
              )}
              keyExtractor={item => item.id}
            />
          </>
        )}
      </View>

      <View style={styles.actionBar}>
        <View>
          {selectedTicketId && ticketData[selectedTicketId] ? (
            <Text style={[styles.price, styles.text, {alignSelf: 'center', paddingVertical: 8}]}>
              Original Price: £
              {ticketData[selectedTicketId].price +
                ticketData[selectedTicketId].booking_fee}
            </Text>
          ) : null}
        </View>
        <View style={{flexDirection: 'row'}}>
          <CustomButton
            title={buyButtonTitle}
            onPress={handleBuyPress}
            color="#43a047"
            disabled={buyButtonDisabled}
          />
          <CustomButton
            title={'Sell'}
            onPress={handleSellPress}
            color="#e53935"
            disabled={!selectedTicketId}
          />
        </View>
      </View>
    </View>
  );
}

function CustomButton({title, onPress, color, disabled}) {
  return (
    <TouchableOpacity
      style={[
        styles.customButton,
        {backgroundColor: disabled ? 'lightgray' : color},
      ]}
      onPress={onPress}
      disabled={disabled}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  container: {
    flex: 1,
    padding: 15,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 30,
    color: '#4a4a4a',
    marginBottom: 20,
  },
  actionBar: {
    flexDirection: 'column',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  customButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
    marginHorizontal: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#fff',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 5,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedListItem: {
    borderColor: '#3f51b5',
    backgroundColor: '#f5f5f5',
  },
  listItemTextContainer: {
    flex: 1,
  },
  text: {
    margin: 3,
    fontSize: 18,
    color: '#4a4a4a',
  },
  price: {
    fontWeight: 'bold',
    alignSelf: 'flex-end',
    color: '#43a047',
    fontSize: 20
  },
  listContainer: {
    marginVertical: 10,
  },
  listTitle: {
    fontWeight: 'bold',
    fontSize: 24,
    color: '#3f51b5',
    marginBottom: 10,
  },
  timeText: {
    fontSize: 18,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  venueText: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  eventImage: {
    width: '100%',
    height: 200,
    marginBottom: 15,
  },
});

export default EventScreen;
