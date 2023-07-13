import React, { useRef, useState } from "react";
import { useNavigation } from '@react-navigation/native';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

function ListItem({ title, object }) {
  const navigation = useNavigation();

  React.useEffect(() => navigation.addListener('beforeRemove', (e) => {

    if (!e.data.action.source.includes("Settings")) {

      e.preventDefault();

    }

  }))
  const handlePress = () => {
    if (title == 'Events') {
      navigation.navigate('Event', {
        fixr_id: object.fixr_id,
        name: object.name,
        image_url: object.image_url,
        venue: object.venue,
      });
    } else {
      navigation.navigate('Vorganiser', {
        fixr_id: object.fixr_id,
        name: object.name,
        image_url: object.image_url,
        city: object.city,
        slug: object.slug,
      });
    }
  };

  const formatTimes = (openTime, closeTime) => {
    if (!openTime || !closeTime) return null;

    const startDate = new Date(openTime);
    const endDate = new Date(closeTime);

    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };

    const startDateString = startDate.toLocaleDateString(undefined, dateOptions);
    const startTimeString = startDate.toLocaleTimeString(undefined, timeOptions);
    const endTimeString = endDate.toLocaleTimeString(undefined, timeOptions);

    if (startDate.toDateString() === endDate.toDateString()) {
      return `${startDateString}, ${startTimeString} - ${endTimeString}`;
    } else {
      const endDateString = endDate.toLocaleDateString(undefined, dateOptions);
      return `${startDateString}, ${startTimeString} - ${endDateString}, ${endTimeString}`;
    }
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.listItem}>
        <View style={styles.listItemTextContainer}>
          <Text style={styles.listItemTitle}>{object.name}</Text>
          {title === 'Events' && object.open_time && object.close_time && (
            <Text style={styles.listItemSubtitle}>{formatTimes(object.open_time, object.close_time)}</Text>
          )}
        </View>
        <Image source={{ uri: object.image_url }} style={styles.listItemImage} />
      </View>
    </TouchableOpacity>
  );
}

function ListContainer({ title, objects }) {
  return (
    <View style={styles.listContainer}>
      <Text style={styles.listTitle}>{title}</Text>
      {objects ? (
        objects.length > 0 ? (
          objects.map(object => (
            <ListItem key={object.fixr_id} title={title} object={object} />
          ))
        ) : (
          <Text style={styles.noResultsText}>No {title} found</Text>
        )
      ) : (
        <Text style={styles.noResultsText}>Type to search</Text>
      )}
    </View>
  );
}

function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [events, setEvents] = useState(null);
  const [venues, setVenues] = useState(null);
  const [organisers, setOrganisers] = useState(null);

  const handleChangeText = text => {
    setSearchText(text);
  };

  const handleSearch = async () => {
    const text = searchText.trim();
    if (text === '') {
      setEvents(null);
      setVenues(null);
      setOrganisers(null);
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:3000/search/GetAll?query=${text}`);
      const searchResults = await response.json();

      setEvents(searchResults.events);
      setVenues(searchResults.venues);
      setOrganisers(searchResults.organisers);
    } catch (error) {
      console.error(error);
    }
  };


  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', margin: 15 }}>
        <TextInput
          style={[styles.searchInput, { flex: 1 }]}
          placeholder="Search"
          value={searchText}
          onChangeText={handleChangeText}
        />
        <TouchableOpacity onPress={handleSearch} style={{ marginLeft: 10 }}>
          <Text style={{ fontSize: 16, color: '#000' }}>Search</Text>
        </TouchableOpacity>
      </View>
      <ScrollView>
        <ListContainer title="Events" objects={events} />
        <ListContainer title="Venues" objects={venues} />
        <ListContainer title="Organisers" objects={organisers} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    margin: 15,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderRadius: 10,
    padding: 10,
    marginVertical: 1,
    marginHorizontal: 10,
  },
  listItemTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: 'gray',
  },
  listItemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 10,
  },
  listTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    margin: 10,
  },
  noResultsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    margin: 10,
  },
});

export default SearchScreen;
