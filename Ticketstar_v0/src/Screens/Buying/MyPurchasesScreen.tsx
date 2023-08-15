import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Linking,
  ActivityIndicator, Alert
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useIsFocused} from '@react-navigation/native';
import {API_URL_PROD, API_URL_LOCAL} from '@env';
import {formatTimes} from '../../utilities';
import {loadPurchases } from "../../Dataloaders";

function MyPurchasesScreen({route}) {
  const [purchases, setPurchases] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('unclaimed'); // initialize filter state as 'all'
  const [loading, setLoading] = useState(false);

  const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;
  const {requestRefresh} = route.params || {};
  // const apiUrl = API_URL_PROD;
  const handleFilterChange = newFilter => {
    setFilter(newFilter);
  };

  const handleRefresh = async (filter) => {setLoading(true);
    await reload(filter); // include current filter when refreshing
    setLoading(false);
  };

  const filterPurchases = (data, filterType) => {
    const currentTime = Date.now();

    let filteredData;

    if (filterType === 'upcoming' || filterType === 'past') {

      filteredData = data.filter(event => {
        if (filterType === 'upcoming') {
          return event.open_time * 1000 > currentTime;
        } else if (filterType === 'past') {
          return event.open_time * 1000 <= currentTime;
        }
      });
    } else {

      filteredData = data.filter((event) => {

        event.tickets = event.tickets.filter((ticket) => {

          ticket.purchases = ticket.purchases.filter((purchase) => {
            return !purchase.claimed;
          });

          return ticket.purchases.length > 0;

        });

        return event.tickets.length > 0;

      });

    }

    // If the filterType is 'unclaimed', further refine each event to only contain unclaimed tickets


    return filteredData;
  };




  const reload = async () => {

    setLoading(true);
    await loadPurchases();
    await fetchAndFilterPurchases();
    setLoading(false);

  };

  const fetchAndFilterPurchases = async () => {
    const storedData = JSON.parse(await AsyncStorage.getItem('UserPurchases'));
    const filteredData = filterPurchases(storedData, filter);
    setPurchases(filteredData);
  };

  useEffect(() => {

    fetchAndFilterPurchases();

    if (requestRefresh){
      reload();
    }
  }, [])

  useEffect(() => {

    fetchAndFilterPurchases();
  }, [filter]);

  const toggleEventExpanded = index => {
    const newPurchases = [...purchases];
    newPurchases[index].isExpanded = !newPurchases[index].isExpanded;
    setPurchases(newPurchases);
  };

  const toggleTicketExpanded = (eventIndex, ticketIndex) => {
    const newPurchases = [...purchases];
    newPurchases[eventIndex].tickets[ticketIndex].isExpanded =
      !newPurchases[eventIndex].tickets[ticketIndex].isExpanded;
    setPurchases(newPurchases);
  };

  const handleTransfer = async askId => {
    setRefreshing(true);
    const userId = await AsyncStorage.getItem('user_id');
    const response = await fetch(`${apiUrl}/transfers/${askId}`, {
      method: 'POST',
      body: JSON.stringify({
        'user_id': userId,
      })
    });
    const body = await response.json();

    if (response.ok) {
      // Assuming the API response contains a 'transfer_url' field
      const transferUrl = body.transfer_url;
      Linking.openURL(transferUrl);
    } else {
      console.error('Failed to fetch transfer URL: ', body);
      if (body.reason === 'TicketNoLongerAvailable'){
        Alert.alert('Ticket no longer available to claim');
        reload();
      }
    }
    setRefreshing(false);
  };

  const getTitle = (filter) => {
    switch (filter) {
      case 'unclaimed':
        return 'You have no unclaimed purchases';
      case 'upcoming':
        return 'You have no upcoming events';
      case 'past':
        return 'You have no past events';
    }
  };

  const getSubTitle = (filter) => {
    switch (filter){
      case 'unclaimed':
        return 'When you make a purchase you can claim it here';
      case 'upcoming':
        return '';
      case 'past':
        return '';
    }
  };

  const title = `${getTitle(filter)}`;
  const subTitle = `${getSubTitle(filter)}`;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        // include the RefreshControl component in ScrollView
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={'black'}/>
      }>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Your Purchases</Text>
      </View>
      <View style={styles.filterContainer}>
        <TouchableOpacity onPress={() => handleFilterChange('unclaimed')}>
          <Text
            style={
              filter === 'unclaimed' ? styles.filterTextActive : styles.filterText
            }>
            Unclaimed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleFilterChange('upcoming')}>
          <Text
            style={
              filter === 'upcoming' ? styles.filterTextActive : styles.filterText
            }>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleFilterChange('past')}>
          <Text
            style={
              filter === 'past'
                ? styles.filterTextActive
                : styles.filterText
            }>
            Past
          </Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : purchases && purchases.length > 0 ? (
        purchases.map((event, eventIndex) => (
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
                    Object.keys(ticket.purchases).map(
                      (purchaseId, purchaseIndex) => {
                        let claimed = ticket.purchases[purchaseId].claimed;

                        return (
                          <View
                            key={purchaseIndex}
                            style={styles.subSubListItem}>
                            <View style={styles.subSubListItemTextContainer}>
                              <Text style={styles.subSubListItemText}>
                                Price: £{ticket.purchases[purchaseId].price}
                              </Text>
                              <Text style={styles.subSubListItemText}>
                                {claimed ? (
                                  <Text>Ticket has been claimed</Text>
                                ) : (
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleTransfer(
                                        ticket.purchases[purchaseId].ask_id,
                                      )
                                    }>
                                    <Text style={styles.transferButtonText}>
                                      Claim Ticket
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </Text>
                            </View>
                          </View>
                        );
                      },
                    )}
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
            {title}
          </Text>
          <Text style={styles.emptyListingsSubTitle}>
            {subTitle}
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

export default MyPurchasesScreen;
