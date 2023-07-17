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
import { API_URL_PROD, API_URL_LOCAL } from '@env'
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

  const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;

  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [eventData, setEventData] = useState(null);
  const [ticketData, setTicketData] = useState(null);

  const [selectedTicketId, setSelectedTicketId] = useState(null)

  const [currentUserId, setCurrentUserId] = useState(null)

  const [buyButtonTitle, setBuyButtonTitle] = useState(
      "Buy - No Ticket Selected"
  )
  const [buyButtonDisabled, setBuyButtonDisabled] = useState(true);
  const [cheapest, setCheapest] = useState(null);
  const [askId, setAskId] = useState(null);
  const [price, setPrice] = useState(null);

  const handleBuyPress = () => {

    const navigate = async () => {

      const response = await fetch(apiUrl + "/listings/reserve", {
        method: "POST",
        body: JSON.stringify({
          'user_id': currentUserId,
          'ask_id': askId,
          'price': price
        })
      })

      console.log(response.status)

    }

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

  }

  const handleSellPress = () => {

  }

  const initializeData = async () => {
    const userIdFromStorage = await AsyncStorage.getItem('user_id')
    setCurrentUserId(userIdFromStorage);
    await fetchData();
  }

  const fetchData = async () => {
    setIsLoading(true);
    const response = await fetch(apiUrl + `/search/event/${fixr_id}?user_id=${currentUserId}`, {
      method: 'GET'
    });

    const event_data = await response.json()
    setEventData(event_data);
    console.log(event_data)

    let tickets = {}

    if (event_data.tickets) {

      event_data.tickets.forEach(function (ticket) {

        let ticket_info = ticket;
        tickets[ticket.id] = ticket_info;

      })

      setTicketData(tickets)

    }

    setIsLoading(false);

  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }

  useEffect(() => {
    initializeData();
  }, [])

  useEffect(() => {

    if (ticketData){
      if (ticketData[selectedTicketId].listing) {

        const listing = ticketData[selectedTicketId].listing;
        const price = listing.ask_price

        setBuyButtonTitle(`Buy - £${price}`)
        setBuyButtonDisabled(false);
        setCheapest(listing.cheapest);
        setAskId(listing.ask_id)
        setPrice(price)

      } else {

        setBuyButtonTitle(`No Tickets Available`)
        setBuyButtonDisabled(true);
        setCheapest(null)
        setAskId(null);
        setPrice(null)

      }
    }

  }, [selectedTicketId])

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
              onSelectTicket={setSelectedTicketId}
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
