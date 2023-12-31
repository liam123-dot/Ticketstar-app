import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl, Alert, Linking
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useIsFocused, useNavigation } from "@react-navigation/native";
import {formatTimes} from '../../utilities';
import {API_URL_PROD, API_URL_LOCAL} from '@env';
import {loadListings} from '../../Dataloaders';
import {handleTransfer} from "../../TicketTransfer";
import { MainColour } from "../../OverallStyles";

const filterListings = (data, filterType) => {
  // Filter based on ticket's fulfilled status
  if (filterType === 'all'){
    return data;
  }

  let filteredData = data.filter(event => {

    event.tickets = event.tickets.filter((ticket) => {

      ticket.listings = ticket.listings.filter((listing) => {

        if (filterType === 'sold') {

          return listing.fulfilled;

        } else {

          return !listing.fulfilled;

        }

      })

      return ticket.listings.length > 0;

    })

    return event.tickets.length > 0;

  });

  // Remove events with no tickets
  filteredData = filteredData.filter(event => event.tickets.length > 0);

  return filteredData;
};

const countListings = async (filterType) => {

  let count = 0;

  const data = JSON.parse(await AsyncStorage.getItem('UserListings'));

  if (!data){
    return;
  }

  data.forEach(event => {
    event.tickets.forEach(ticket => {

      ticket.listings.forEach(listing => {

        if (filterType === 'all'){
          count += 1;
        } else {
          if (listing.fulfilled === (filterType === 'sold')){
            count += 1;
          }
        }

      });

    })
  })

  return count;

}

function MyListingsScreen({route}) {

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

      setRefreshing(true);

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

      } else {
        Alert.alert('Ticket not amendable', 'Someone is in the process of buying');
        reload();
      }
      setRefreshing(false);
    };

    return (
      <TouchableOpacity onPress={handlePress} style={styles.amendButton}>
        <Text style={styles.amendButtonText}>Amend</Text>
      </TouchableOpacity>
    );
  }

  const [listings, setListings] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('unsold');
  const [sellerVerified, setSellerVerified] = useState(false);

  const [allCount, setAllCount] = useState(0);
  const [fulfilledCount, setFulfilledCount] = useState(0);
  const [unfulfilledCount, setUnfulfilledCount] = useState(0);

  const [pdfClaimable, setPDFClaimable] = useState({});

  const scrollViewRef = useRef(null);

  const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;

  useEffect(() => {

    const checkSellerEnabled = async () => {

      const sellerVerified = await AsyncStorage.getItem('SellerVerified') === 'true';
      setSellerVerified(sellerVerified);

    };
    checkSellerEnabled();
  }, []);

  const countAllFilters = async () => {

    setAllCount(await countListings('all'));
    setFulfilledCount(await countListings('sold'));
    setUnfulfilledCount(await countListings('unsold'));

    if (allCount > 0){
      setSellerVerified(true);
    }

  };

  useEffect(() => {

    const fetchAndFilterListings = async () => {
      const storedData = JSON.parse(await AsyncStorage.getItem('UserListings'));
      const filteredData = filterListings(storedData, filter);
      setListings(filteredData);
    };

    fetchAndFilterListings();
    countAllFilters();
  }, [filter]);

  useFocusEffect(
    React.useCallback(() => {
      // The code here will run every time the screen is focused/navigated to
      const checkRefresher = async () => {

        const response = await AsyncStorage.getItem('refreshListings');

        if (response === 'true'){
          reload();
          await AsyncStorage.setItem('refreshListings', 'false');
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
    await reload();
    setRefreshing(false);
  };

  console.log(filter)

  const filterData = async () => {
    const storedData = JSON.parse(await AsyncStorage.getItem('UserListings'));
    console.log('filter data filter: ' + filter)
    const filteredData = filterListings(storedData, filter);
    setListings(filteredData);
  };

  const reload = async () => {

    setRefreshing(true);
    await loadListings();
    await filterData();
    await countAllFilters();
    setRefreshing(false);

  };

  const scrollDown = () => {
    if (scrollViewRef.current) {
      // Scroll down to the bottom
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }

  const toggleEventExpanded = index => {
    const newListing = [...listings];
    newListing[index].isExpanded = !newListing[index].isExpanded;

    if (newListing[index].isExpanded) {
      newListing[index].tickets.forEach(ticket => {
        ticket.isExpanded = true;  // Expanding all tickets under the event
      });
    } else {
      newListing[index].tickets.forEach(ticket => {
        ticket.isExpanded = false;  // Collapsing all tickets under the event
      });
    }

    setListings(newListing);
  };

  const toggleTicketExpanded = (eventIndex, ticketIndex) => {
    const newListing = [...listings];
    newListing[eventIndex].tickets[ticketIndex].isExpanded =
      !newListing[eventIndex].tickets[ticketIndex].isExpanded;
    setListings(newListing);
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

  const title = `You have ${getTitle(filter)}`;
  const subTitle = `${getSubTitle(filter)}`;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        // include the RefreshControl component in ScrollView
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={MainColour}/>
      }
      ref={scrollViewRef}
    >

      <View style={styles.titleContainer}>
        <View>
          <Text style={styles.title}>Your Listings</Text>
        </View>
        <View style={styles.filterContainer}>
          <TouchableOpacity onPress={() => setFilter('unsold')}>
            <Text
              style={filter === 'unsold' ? styles.filterTextActive : styles.filterText}
            >Unsold - {unfulfilledCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilter('sold')}>
            <Text
              style={filter === 'sold' ? styles.filterTextActive : styles.filterText}
            >Sold - {fulfilledCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilter('all')}>
            <Text
              style={filter === 'all' ? styles.filterTextActive : styles.filterText}
            >All - {allCount}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {

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

                                <View>

                                <TouchableOpacity
                                  onPress={() =>
                                    handleTransfer(ticket.listings[askId].ask_id, setRefreshing, setPDFClaimable)
                                  }
                                  disabled={refreshing}
                                >
                                  {!pdfClaimable[ticket.listings[askId].ask_id] ?
                                    (<Text style={styles.transferButtonText}>
                                    Re-claim ticket
                                  </Text>): <Text>Ticket not transferable</Text>
                                  }
                                </TouchableOpacity>

                                  {pdfClaimable[ticket.listings[askId].ask_id] && (
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
                                                ask_id: ticket.listings[askId].ask_id,
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
                Once you list your first ticket it will appear here
              </Text>
            </View>)
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 5,
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
    padding: 10,
    marginTop: 10,
    marginVertical: 5,
    borderRadius: 5,
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 2
    // },
    // shadowOpacity: 0.25,
    // shadowRadius: 3.84,
    // elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 0,
    marginTop: 0,
    padding: 10,
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
