import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Linking, ActivityIndicator
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {formatTimes} from '../../../../../../Ticketstar_v0/src/utilities';
import {API_URL_PROD, API_URL_LOCAL} from '@env';

function AmendButton({
  fixr_ticket_id,
  fixr_event_id,
  ticket_name,
  event_name,
  ask_id,
  current_price,
}) {
  const navigation = useNavigation();

  const handlePress = async () => {
    const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;

    const response = await fetch(`${apiUrl}/CheckListingEditable/${ask_id}`, {

      method: 'GET',

    });

    if (response.ok) {

      const data = await response.json();

      const reserve_timeout = data.reserve_timeout;

      navigation.navigate('HomeStack', {
        screen: 'Post Ask',
        params: {
          fixr_ticket_id: fixr_ticket_id,
          fixr_event_id: fixr_event_id,
          ticket_name: ticket_name,
          event_name: event_name,
          ticket_verified: true,
          ask_id: ask_id,
          current_price: current_price,
          reserve_timeout: reserve_timeout,
        },
      });

    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.amendButton}>
      <Text style={styles.amendButtonText}>Amend</Text>
    </TouchableOpacity>
  );
}

function MyListingsScreen() {
  const [listings, setListings] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sellerVerified, setSellerVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const RelistButton = ({ask_id}) => {
    const handlePress = async () => {
      // Your fetch call here
      const response = await fetch(`${apiUrl}/listing/relist`, {
        method: 'PUT',
        body: JSON.stringify({
          ask_id: ask_id,
        }),
      });

      if (response.status === 200) {
        fetchData();
      }
    };

    return (
      <TouchableOpacity onPress={handlePress} style={styles.relistButton}>
        <Text style={styles.relistButtonText}>Re-list</Text>
      </TouchableOpacity>
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;

  const fetchData = async () => {
    setLoading(true);
    const user_id = await AsyncStorage.getItem('user_id');
    const seller_verified = (await AsyncStorage.getItem("SellerVerified")) === 'true';
    setSellerVerified(seller_verified);

    fetch(`${apiUrl}/listing?filter=${filter}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: user_id,
      },
    })
      .then(response => response.json())
      .then(data => {
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
          setListings(expandedData);
        }
      })
      .catch(error => {
        console.error('Error: ', error);
        setLoading(false);
      });
    setLoading(false);
  };

  const isFocused = useIsFocused();

  useEffect(() => {
    fetchData();
  }, [isFocused]);

  const toggleEventExpanded = index => {
    const newListing = [...listings];
    newListing[index].isExpanded = !newListing[index].isExpanded;
    setListings(newListing);
  };

  const toggleTicketExpanded = (eventIndex, ticketIndex) => {
    const newListing = [...listings];
    newListing[eventIndex].tickets[ticketIndex].isExpanded =
      !newListing[eventIndex].tickets[ticketIndex].isExpanded;
    setListings(newListing);
  };

  const handleFilterChange = async filter => {
    setFilter(filter);
    // setRefreshing(true);
    // await fetchData();
    // setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleTransfer = async askId => {
    const response = await fetch(`${apiUrl}/transfers/${askId}`);
    const body = await response.json();

    if (response.ok) {
      // Assuming the API response contains a 'transfer_url' field
      const transferUrl = body.transfer_url;
      Linking.openURL(transferUrl);
    } else {
      console.error('Failed to fetch transfer URL: ', body);
    }
  };

  const getTitle = (filter) => {
    switch (filter) {
      case 'all':
        return 'not posted any listings yet';
      case 'unsold':
        return 'no unsold listings';
      case 'sold':
        return 'no sold listings';
      default:
        return 'not posted any listings yet';
    }
  };

  const getSubTitle = (filter) => {
    switch (filter){
      case 'all':
        return 'When you post a listing, it will appear here';
      case 'unsold':
        return 'When you post a listing, it will appear here';
      case 'sold':
        return 'When a listing sells, it will appear here';
    }
  }


  // const subTitle =
  // filter === 'all' || filter === 'unsold'
  //   ? 'When you post a listing, it will appear here'
  //   : 'When a listing sells, it will appear here';

  const title = `You have ${getTitle(filter)}`;
  const subTitle = `${getSubTitle(filter)}`;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        // include the RefreshControl component in ScrollView
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Your Listings</Text>
      </View>
      <View style={styles.filterContainer}>
        <TouchableOpacity onPress={() => handleFilterChange('all')}>
          <Text
            style={
              filter === 'all' ? styles.filterTextActive : styles.filterText
            }>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleFilterChange('unsold')}>
          <Text
            style={
              filter === 'unsold' ? styles.filterTextActive : styles.filterText
            }>
            Unsold
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleFilterChange('sold')}>
          <Text
            style={
              filter === 'sold' ? styles.filterTextActive : styles.filterText
            }>
            Sold
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ): (

      sellerVerified ?

      listings && listings.length > 0 ? (
        listings.map((event, eventIndex) => (
          <View key={eventIndex}>
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => toggleEventExpanded(eventIndex)}>
              <View style={styles.listItemTextContainer}>
                <Text style={styles.listItemTitle}>{event.event_name}</Text>
                <Text>
                  {formatTimes(event.open_time * 1000, event.close_time * 1000)}
                </Text>
              </View>
              <Image
                source={{uri: event.image_url}}
                style={styles.listItemImage}
              />
            </TouchableOpacity>

            {event.isExpanded &&
              event.tickets.map((ticket, ticketIndex) => (
                <View key={ticketIndex} style={styles.subListItem}>
                  <TouchableOpacity
                    onPress={() =>
                      toggleTicketExpanded(eventIndex, ticketIndex)
                    }>
                    <Text style={styles.subListItemText}>
                      {ticket.ticket_name}
                    </Text>
                  </TouchableOpacity>

                  {ticket.isExpanded &&
                    Object.keys(ticket.listings).map((askId, askIndex) => (
                      <View key={askIndex} style={styles.subSubListItem}>
                        <View style={styles.subSubListItemTextContainer}>
                          <Text style={styles.subSubListItemText}>
                            Price: £{ticket.listings[askId].price}
                          </Text>
                          <Text style={styles.subSubListItemDescription}>
                            {ticket.listings[askId].listed
                              ? ticket.listings[askId].fulfilled
                                ? 'Sold'
                                : 'Not Sold'
                              : 'Not Listed'}
                          </Text>
                          {ticket.listings[askId].listed ? (
                            <></>
                          ) : ticket.listings[askId].ownership ? (
                            <TouchableOpacity
                              onPress={() =>
                                handleTransfer(ticket.listings[askId].ask_id)
                              }>
                              <Text style={styles.transferButtonText}>
                                Re-claim ticket
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <Text>Ticket has been reclaimed</Text>
                          )}
                        </View>

                        {ticket.listings[askId].fulfilled ? (
                          <></>
                        ) : ticket.listings[askId].listed ? (
                          <AmendButton
                            ask_id={ticket.listings[askId].ask_id}
                            event_name={event.event_name}
                            ticket_name={ticket.ticket_name}
                            fixr_event_id={ticket.listings[askId].fixr_event_id}
                            fixr_ticket_id={
                              ticket.listings[askId].fixr_ticket_id
                            }
                            current_price={ticket.listings[askId].price}
                          />
                        ) : ticket.listings[askId].ownership ? (
                          <>
                            <RelistButton
                              ask_id={ticket.listings[askId].ask_id}
                            />
                          </>
                        ) : (
                          <></>
                        )}
                      </View>
                    ))}
                </View>
              ))}
          </View>
        ))
      ) : (
        <View style={styles.emptyListings}>
          <Text style={styles.emptyListingsTitle}>
            {title}
          </Text>
          <Text style={styles.emptyListingsSubTitle}>
            {subTitle}
          </Text>
        </View>
      )
        :(
        <View style={styles.emptyListings}>
      <Text style={styles.emptyListingsTitle}>
        Proceed to settings to become a seller
      </Text>
          <Text style={styles.emptyListingsSubTitle}>
            Once you list your first event it will appear here
          </Text>
    </View>)

        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginTop: 10,
    borderBottomWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 5,
    backgroundColor: 'white',
    marginVertical: 5,
  },
  listItemTextContainer: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 24,
    fontWeight: '500',
  },
  listItemImage: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 30,
  },
  subListItem: {
    backgroundColor: 'white',
    paddingLeft: 20,
    paddingVertical: 10,
    marginVertical: 2,
    borderBottomWidth: 1,
    borderColor: '#dddddd',
  },
  subListItemText: {
    paddingVertical: 5,
    fontSize: 22,
    fontWeight: '500',
  },
  subSubListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 40,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'lightgrey',
  },
  subSubListItemTextContainer: {
    flex: 1,
  },
  subSubListItemText: {
    fontSize: 18,
    fontWeight: '500',
  },
  subSubListItemDescription: {
    fontSize: 18,
    color: 'gray',
  },
  amendButton: {
    backgroundColor: '#e53935',
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginHorizontal: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  amendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  emptyListings: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  emptyListingsImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  emptyListingsTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyListingsSubTitle: {
    fontSize: 18,
    textAlign: 'center',
    color: 'gray',
  },
  titleContainer: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 0,
    borderRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  relistButton: {
    backgroundColor: '#ff9800', // You can change this to any color you like
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginHorizontal: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  relistButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 0,
    marginTop: 0,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  filterText: {
    fontSize: 20,
    color: 'gray',
  },
  filterTextActive: {
    fontSize: 20,
    color: 'black',
    fontWeight: 'bold',
  },
  transferButtonText: {
    color: 'blue', // Or any color that suits your style
    fontSize: 18,
  },
});

export default MyListingsScreen;
