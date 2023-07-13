import React, {useState, useEffect} from 'react';
import {
  Alert,
  Button,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function ListItem({object, onSelect, isSelected}) {
  return (
    <TouchableOpacity
      style={[styles.listItem, isSelected ? styles.selectedListItem : null]}
      onPress={() => onSelect(object.id)}>
      <View style={styles.listItemTextContainer}>
        <Text style={styles.text}>{object.name}</Text>
        <Text style={[styles.price, styles.text]}>
          Original Price: £{object.price + object.booking_fee}
        </Text>
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

function EventScreen({route}) {
  const {fixr_id, name, image_url, venue} = route.params;
  const [eventData, setEventData] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [askExists, setAskExists] = useState(null);
  const [currentAskId, setCurrentAskId] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [buyButtonTitle, setBuyButtonTitle] = useState(
    'Buy - No tickets available',
  );
  const [buyButtonDisabled, setBuyButtonDisabled] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null); // <- Add this line
  const [cheapestAsk, setCheapestAsk] = useState(false);

  const navigation = useNavigation();

  const initializeData = async () => {
    const userIdFromStorage = await AsyncStorage.getItem('user_id');
    setCurrentUserId(userIdFromStorage);

    // Now, fetch event data
    await fetchData(userIdFromStorage);
  };

  const handleBuyPress = () => {
    console.log(currentUserId);
    const navigate = () => {
      fetch('http://127.0.0.1:3000/Asks/Reserve', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ask_id: currentAskId,
          user_id: currentUserId,
        }),
      })
        .then(async response => {
          if (!response.ok) {
            let data = await response.json();

            if (data.reserver_user_id === currentUserId) {
              navigation.navigate("Buy", {
                ticket_name: ticketData[selectedTicketId].name,
                event_name: eventData.name,
                ask_id: currentAskId,
                price: currentPrice,
                reserve_timeout: data.reserve_timeout
              });
            } else {
              Alert.alert(data.message);

              throw new Error(
                "HTTP status " + response.status + ", " + data.message
              );
            }
          }
          return response.json();
        })
        .then(data => {
          // Handle successful reservation.
          // This could be navigating to another screen or displaying a success message.
          navigation.navigate('Buy', {
            ticket_name: ticketData[selectedTicketId].name,
            event_name: eventData.name,
            ask_id: currentAskId,
            price: currentPrice,
            reserve_timeout: data.reserve_timeout,
          });
        })
        .catch(error => {
          // Handle network errors.
          console.error(error);
        });
    };


    if (!cheapestAsk) {
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

  const handleSellPress = () => {
    navigation.navigate('Post Ask', {
      fixr_ticket_id: selectedTicketId,
      fixr_event_id: eventData.id,
      ticket_name: ticketData[selectedTicketId].name,
      event_name: eventData.name,
      // Pass the selected ask data
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    initializeData().finally(() => setRefreshing(false));
  };

  const handleSelectTicket = ticketId => {
    setSelectedTicketId(ticketId);
  };

  const fetchData = async user_id => {
    try {
      const response = await fetch(
        `http://127.0.0.1:3000/GetEvent?event_id=${fixr_id}&user_id=${user_id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const event_data = await response.json();
      setEventData(event_data);

      let tickets = {};

      if (event_data.tickets) {
        event_data.tickets.forEach(function (ticket) {
          let ticket_info = ticket;
          tickets[ticket.id] = ticket_info;

          let ask_exists = false;
          let ask_price = null;
          let ask_id = null;
          let index = 0;

          let bids_asks = ticket_info.bids_asks;

          if (bids_asks.ask_count > 0) {

            while (index < bids_asks.ask_count) {
              if (bids_asks.asks[index].user_id !== user_id) {

                if (bids_asks.asks[index].reserved) {
                  const currentTime = Date.now() / 1000;

                  if (bids_asks.asks[index].reserve_timeout < currentTime) {
                    fetch('http://127.0.0.1:3000/Asks/Reserve', {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        ask_id: bids_asks.asks[index].ask_id,
                      }),
                    })
                      .then(response => {
                        if (!response.ok) {
                          throw new Error('HTTP status ' + response.status);
                        }
                        return response.json();
                      })
                      .then(data => {
                        // Handle successful reservation.
                        // This could be updating the state or showing a message to the user.
                      })
                      .catch(error => {
                        // Handle network errors.
                        console.error(error);
                      });

                    ask_price = bids_asks.asks[index].price;
                    ask_id = bids_asks.asks[index].ask_id;

                    ask_exists = true;
                    break;
                  } else {
                    break;
                  }


                } else {
                  ask_price = bids_asks.asks[index].price;
                  ask_id = bids_asks.asks[index].ask_id;

                  ask_exists = true;
                  break;
                }
              }

              index++;
            }
          }

          tickets[ticket.id].ask_exists = ask_exists;
          tickets[ticket.id].ask_price = ask_price;
          tickets[ticket.id].ask_id = ask_id;
          tickets[ticket.id].cheapest_ask = (index == 0);

        });

        setTicketData(tickets);
      }
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (ticketData) {
      if (ticketData[selectedTicketId].ask_exists) {
        setAskExists(true);
        setCurrentAskId(ticketData[selectedTicketId].ask_id);

        let price = ticketData[selectedTicketId].ask_price;

        setCurrentPrice(price);

        setBuyButtonTitle(`Buy - £${price}`);
        setBuyButtonDisabled(false);
        setCheapestAsk(ticketData[selectedTicketId].cheapest_ask);
      } else {
        setAskExists(false);
        setCurrentUserId(null);
        setCurrentPrice(null);
        setBuyButtonTitle('No Tickets available');
        setBuyButtonDisabled(true);
        setCheapestAsk(null);
      }
    }
  }, [selectedTicketId]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {isLoading ? (
          <Text style={styles.title}>Loading...</Text>
        ) : (
          <>
            <Text style={styles.title}>{name}</Text>
            <ListContainer
              title="Tickets"
              objects={eventData?.tickets}
              onSelectTicket={handleSelectTicket}
              selectedTicketId={selectedTicketId}
            />
          </>
        )}
      </ScrollView>
      <View style={styles.actionBar}>
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
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 15,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 28,
    marginBottom: 20,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: 'white',
  },
  customButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 16,
    color: 'white',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
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
  },
  listItemTextContainer: {
    flex: 1,
  },
  text: {
    margin: 3,
    fontSize: 16,
  },
  price: {
    fontWeight: 'bold',
    alignSelf: 'flex-end',
  },
  listContainer: {
    marginVertical: 10,
  },
  listTitle: {
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 10,
  },
});

export default EventScreen;
