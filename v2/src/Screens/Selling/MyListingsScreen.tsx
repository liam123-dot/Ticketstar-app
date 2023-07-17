import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useIsFocused, useNavigation} from '@react-navigation/native';

function AmendButton({
  fixr_ticket_id,
  fixr_event_id,
  ticket_name,
  event_name,
  ask_id,
  current_price,
}) {
  const navigation = useNavigation();

  const handlePress = () => {
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
      },
    });
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
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fetchData = async () => {
    const user_id = await AsyncStorage.getItem('user_id');

    fetch(`http://127.0.0.1:3000/Asks?user_id=${user_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
        const expandedData = Object.keys(data).map(eventId => ({
          ...data[eventId],
          isExpanded: false,
          tickets: Object.keys(data[eventId].tickets).map(ticketId => ({
            ...data[eventId].tickets[ticketId],
            isExpanded: false,
          })),
        }));
        setListings(expandedData);
      })
      .catch(error => {
        console.error('Error: ', error);
      });
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
      {listings && listings.length > 0 ? (
        listings.map((event, eventIndex) => (
          <View key={eventIndex}>
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => toggleEventExpanded(eventIndex)}>
              <View style={styles.listItemTextContainer}>
                <Text style={styles.listItemTitle}>{event.event_name}</Text>
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
                    Object.keys(ticket.asks).map((askId, askIndex) => (
                      <View key={askIndex} style={styles.subSubListItem}>
                        <View style={styles.subSubListItemTextContainer}>
                          <Text style={styles.subSubListItemText}>
                            Price: £{ticket.asks[askId].price}
                          </Text>
                          <Text style={styles.subSubListItemDescription}>
                            {ticket.asks[askId].fulfilled ? 'Sold' : 'Not Sold'}
                          </Text>
                        </View>

                        {ticket.asks[askId].fulfilled ? (
                          <></>
                        ) : (
                          <AmendButton
                            ask_id={askId}
                            event_name={event.event_name}
                            ticket_name={ticket.ticket_name}
                            fixr_event_id={ticket.asks[askId].fixr_event_id}
                            fixr_ticket_id={ticket.asks[askId].fixr_ticket_id}
                            current_price={ticket.asks[askId].price}
                          />
                        )}
                      </View>
                    ))}
                </View>
              ))}
          </View>
        ))
      ) : (
        <View style={styles.emptyListings}>
          {/*<Image*/}
          {/*  source={require('./path-to-your-image/noListings.png')}*/}
          {/*  style={styles.emptyListingsImage}*/}
          {/*/>*/}
          <Text style={styles.emptyListingsTitle}>
            You have not posted any listings yet
          </Text>
          <Text style={styles.emptyListingsSubTitle}>
            When you post a listing, it will appear here
          </Text>
        </View>
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
    marginBottom: 10,
    borderRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
});

export default MyListingsScreen;
