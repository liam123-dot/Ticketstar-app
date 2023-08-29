import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl, Linking
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import {API_URL_PROD, API_URL_LOCAL} from '@env';
import {formatTimes} from '../../utilities';
import {loadPurchases } from "../../Dataloaders";
import {handleTransfer} from "../../TicketTransfer";
import { MainColour } from "../../OverallStyles";

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

const countPurchases = async (filterType) => {
  const currentTime = Date.now();
  let count = 0;

  const data = JSON.parse(await AsyncStorage.getItem('UserPurchases'));

  data.forEach(event => {
    if (filterType === 'upcoming' || filterType === 'past') {
      const isValidEvent = filterType === 'upcoming'
        ? event.open_time * 1000 > currentTime
        : event.open_time * 1000 <= currentTime;

      if (isValidEvent) {
        event.tickets.forEach(ticket => {
          count += ticket.purchases.length;
        });
      }
    } else if (filterType === 'unclaimed') {
      event.tickets.forEach(ticket => {
        count += ticket.purchases.filter(purchase => !purchase.claimed).length;
      });
    }
  });

  return count;
};

function MyPurchasesScreen({route}) {
  const [purchases, setPurchases] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('unclaimed'); // initialize filter state as 'all'

  const [unclaimedCount, setUnclaimedCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [pastCount, setPastCount] = useState(0);

  const [pdfClaimable, setPDFClaimable] = useState({});

  const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;

  // const apiUrl = API_URL_PROD;

  const countAllFilters = async () => {

    setUnclaimedCount(await countPurchases('unclaimed'));
    setUpcomingCount(await countPurchases('upcoming'));
    setPastCount(await countPurchases('past'));

  };

  useEffect(() => {

    filterData();

  }, [])

  useEffect(() => {

    filterData();
    countAllFilters()
  }, [filter]);

  useFocusEffect(
    React.useCallback(() => {
      // The code here will run every time the screen is focused/navigated to

        const checkRefresher = async () => {

          const response = await AsyncStorage.getItem('refreshPurchases');

          if (response === 'true'){
            reload();
            await AsyncStorage.setItem('refreshPurchases', 'false');
          }

        }

        checkRefresher()

      return () => {
        // Optional: The code here will run when the screen is navigated away from
      };
    }, []) // You can add any dependencies here if needed
  );


  const handleRefresh = async () => {
    setRefreshing(true);
    await reload(); // include current filter when refreshing
    setRefreshing(false);
  };

  const filterData = async () => {
    const storedData = JSON.parse(await AsyncStorage.getItem('UserPurchases'));
    const filteredData = filterPurchases(storedData, filter);
    setPurchases(filteredData);
  };

  const reload = async () => {

    setRefreshing(true);
    await loadPurchases();
    await filterData();
    await countAllFilters();
    setRefreshing(false);

  };

  const toggleEventExpanded = index => {
    const newPurchase = [...purchases];
    newPurchase[index].isExpanded = !newPurchase[index].isExpanded;

    if (newPurchase[index].isExpanded) {
      newPurchase[index].tickets.forEach(ticket => {
        ticket.isExpanded = true;  // Expanding all tickets under the event
      });
    } else {
      newPurchase[index].tickets.forEach(ticket => {
        ticket.isExpanded = false;  // Collapsing all tickets under the event
      });
    }

    setPurchases(newPurchase);
  };

  const toggleTicketExpanded = (eventIndex, ticketIndex) => {
    const newPurchases = [...purchases];
    newPurchases[eventIndex].tickets[ticketIndex].isExpanded =
      !newPurchases[eventIndex].tickets[ticketIndex].isExpanded;
    setPurchases(newPurchases);
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
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={MainColour}/>
      }>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Your Purchases</Text>
      </View>
      <View style={styles.filterContainer}>
        <TouchableOpacity onPress={() => setFilter('unclaimed')}>
          <Text
            style={
              filter === 'unclaimed' ? styles.filterTextActive : styles.filterText
            }>
            Unclaimed - {unclaimedCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('upcoming')}>
          <Text
            style={
              filter === 'upcoming' ? styles.filterTextActive : styles.filterText
            }>
            Upcoming - {upcomingCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('past')}>
          <Text
            style={
              filter === 'past'
                ? styles.filterTextActive
                : styles.filterText
            }>
            Past - {pastCount}
          </Text>
        </TouchableOpacity>
      </View>
      {
      purchases && purchases.length > 0 ? (
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
                                {claimed || pdfClaimable[ticket.purchases[purchaseId].ask_id]? (
                                  pdfClaimable[ticket.purchases[purchaseId].ask_id] ? (
                                      <Text>Ticket not transferable</Text>
                                    ): (
                                  <Text>Ticket has been claimed</Text>)
                                ) : (
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleTransfer(
                                        ticket.purchases[purchaseId].ask_id,
                                        setRefreshing,
                                        setPDFClaimable,
                                      )
                                    }
                                    disabled={refreshing}
                                  >
                                    <Text style={styles.transferButtonText}>
                                      Claim Ticket
                                    </Text>
                                  </TouchableOpacity>

                                )}
                              </Text>
                              {pdfClaimable[ticket.purchases[purchaseId].ask_id] && (
                                <TouchableOpacity
                                  onPress={() =>
                                  {
                                    const openPDFUrl = async () => {
                                      setRefreshing(true);
                                      const response = await fetch(
                                        apiUrl + '/pdf/GetLink',
                                        {
                                          method: 'POST',
                                          body: JSON.stringify({
                                            ask_id: ticket.purchases[purchaseId].ask_id,
                                          })
                                        }
                                      )
                                      const data = await response.json();
                                      console.log(data);
                                      Linking.openURL(data.url);
                                      setRefreshing(false);
                                    }
                                    openPDFUrl();
                                  }}
                                >
                                  <Text style={[styles.transferButtonText]}>Claim PDF</Text>
                                </TouchableOpacity>
                              )}
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
    backgroundColor: 'white',
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
    backgroundColor: 'white',
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
    backgroundColor: 'white',
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
