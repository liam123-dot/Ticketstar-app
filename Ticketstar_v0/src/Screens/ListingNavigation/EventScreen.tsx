import React, {useState, useEffect, useContext} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {API_URL_PROD, API_URL_LOCAL} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {formatTimes} from '../../utilities';
import { convertToGMT } from "../../utilities";
import { BackButton } from "../BackButton";

function ListItem({object, onSelect, isSelected}) {
  return (
    <TouchableOpacity
      style={[styles.listItem, isSelected ? styles.selectedListItem : null]}
      onPress={() => onSelect(object.id)}>
      <View style={styles.listItemTextContainer}>
        <Text style={styles.text}>{object.name}</Text>
        {object.listing ? (
          <View style={{flexDirection: 'row'}}>
            <Text
              style={{
                color: '#43a047',
                fontSize: 20,
                flex: 1,
              }}>
              Available: {object.listing_count}
            </Text>
            <Text
              style={{
                fontWeight: 'bold',
                alignSelf: 'flex-end',
                color: '#43a047',
                fontSize: 20,
                flex: 1,
                textAlign: 'right',
              }}>
              £{parseFloat(object.listing.ask_price).toFixed(2)}
            </Text>
          </View>
        ) : (
          <></>
        )}
      </View>
    </TouchableOpacity>
  );
}

function EventScreen({route, navigation}) {
  const {fixr_id, name, image_url, venue, open_time, close_time, user_id} =
    route.params;

  let apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;
  // const apiUrl = API_URL_PROD;

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

  const handleBuyPress = () => {
    if (!ticketData[selectedTicketId].listing.purchasable){
      Alert.alert('You cannot purchase your own listing');
    } else {
      setIsLoading(true);
      const navigate = async () => {
        const response = await fetch(apiUrl + '/listings/reserve', {
          method: 'POST',
          body: JSON.stringify({
            user_id: user_id,
            ask_id: askId,
            price: price,
          }),
        });

        const data = await response.json();

        if (response.status === 400) {
          fetchData();
          setSelectedTicketId(null);

          if (data.reason === 'ListingFulfilled') {
            Alert.alert('Listing no longer available');
          } else if (data.reason === 'NotPurchasableBySeller') {
            Alert.alert('You cannot purchase your own listing');
          }
        } else if (response.status === 200) {
          setIsLoading(false);
          const reserveTimeout = data.reserve_timeout;

          navigation.navigate('Payment Screen', {
            price,
            askId,
            reserveTimeout,
            eventName: name,
            ticketName: ticketData[selectedTicketId].name,
          });
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
            { text: 'Yes', onPress: () => navigate() },
          ],
        );
      } else {
        navigate();
      }
    }
  };

  const handleSellPress = async () => {
    const sellerVerified =
      (await AsyncStorage.getItem('SellerVerified')) === 'true';

    if (sellerVerified) {
      navigation.navigate('Post Ask', {
        fixr_ticket_id: ticketData[selectedTicketId].fixr_ticket_id,
        fixr_event_id: eventData.fixr_event_id,
        ticket_name: ticketData[selectedTicketId].name,
        event_name: name,
        // Pass the selected ask data
      });
    } else {
      Alert.alert(
        'You have not signed up to be a seller.',
        'Proceed to settings to sign up',
      );
    }
  };

  const initializeData = async () => {
    await fetchData();
  };

  const fetchData = async refreshing => {
    setIsLoading(true);
    try {
      const api = refreshing ? `/search/event/${fixr_id}?user_id=${user_id}&refreshing=true`: `/search/event/${fixr_id}?user_id=${user_id}`;
      const response = await fetch(
        apiUrl + api,
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
    await fetchData(true);
    setRefreshing(false);
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
      refreshing ? 'No Ticket Selected' : 'No Tickets',
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
            <BackButton navigation={navigation} goBack={true} styles={{
              color: 'white',
              position: 'absolute',
              top: 10,  // adjust based on your layout
              left: 10, // adjust based on your layout
              padding: 5,  // padding for a larger touch area
              borderRadius: 25, // circular touch area
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}/>
            {/*<View style={{*/}
            {/*  top: '5%'*/}
            {/*}}>*/}
              <Image
                source={{uri: image_url}}
                style={styles.eventImage}
                PlaceholderContent={<ActivityIndicator />} // A placeholder component for the image
              />
              <Text style={styles.title}>{name}</Text>
              <Text style={styles.timeText}>
                {open_time && close_time ? formatTimes(open_time, close_time) : convertToGMT(open_time)}
              </Text>
              <Text style={{    color: '#666',
                fontStyle: 'italic', alignSelf: 'flex-end', fontSize: 18}}>Recent searches: {eventData?.search_count ? eventData.search_count: '0'}</Text>
              <Text style={styles.venueText}>{venue}</Text>
              <FlatList // Using FlatList for better performance
                data={eventData?.tickets}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                  />
                }
                renderItem={({item}) => (
                  <ListItem
                    object={item}
                    onSelect={setSelectedTicketId}
                    isSelected={selectedTicketId === item.id}
                  />
                )}
                keyExtractor={item => item.id}
              />
            {/*</View>*/}
          </>
        )}
      </View>

      <View style={styles.actionBar}>
        <View>
          {selectedTicketId && ticketData[selectedTicketId] ? (
            <Text
              style={[
                styles.price,
                styles.text,
                {alignSelf: 'center', paddingVertical: 8},
              ]}>
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
    padding: '2%',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 24,
    color: '#4a4a4a',
    marginBottom: 10,
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
    margin: 0,
    fontSize: 18,
    color: '#4a4a4a',
  },
  listContainer: {
    marginVertical: 10,
  },
  listTitle: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#3f51b5',
    marginBottom: 10,
  },
  timeText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  venueText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  eventImage: {
    width: '100%',
    height: '10%',
    height: '20%',
    marginBottom: 15,
  },
});

export default EventScreen;
