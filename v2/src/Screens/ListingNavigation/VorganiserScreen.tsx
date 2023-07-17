import React, { useState, useEffect } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

function ListItem({ title, object }) {
  const navigation = useNavigation();

  const convertToGMT = (epochTime) => {
    const date = new Date(epochTime * 1000);
    return date.toUTCString();
  };

  const handlePress = () => {
    navigation.navigate('Event', {
      fixr_id: object.fixr_id,
      name: object.name,
      image_url: object.image_url,
      venue: object.venue,
    });

  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.listItem}>
      <View style={styles.listItemTextContainer}>
        <Text style={styles.listItemTitle}>{object.name}</Text>
        {object.open_time && (
          <Text style={styles.listItemOpenTime}>{convertToGMT(object.open_time)}</Text>
        )}
      </View>
      <Image source={{ uri: object.image_url }} style={styles.listItemImage} />

    </TouchableOpacity>
  );
}

function ListContainer({ title, objects }) {
  return (
    <View style={styles.listContainer}>
      <Text style={styles.listTitle}>{title}</Text>
      {objects && objects.length > 0 ? (
        objects.map(object => (
          <ListItem key={object.fixr_id} title={title} object={object} />
        ))
      ) : (
        <Text style={styles.noItems}>No {title}</Text>
      )}
    </View>
  );
}

function VorganiserScreen({ route }) {
  const { fixr_id, name, image_url, city, slug } = route.params;
  const [events, setEvents] = useState(null);
  let title = city == null ? 'Organiser' : 'Venue';

  useEffect(() => {
    const url = title === 'Organiser' ?
      `http://127.0.0.1:3000/search/organiser?slug=${slug}&organiser_id=${fixr_id}` :
      `http://127.0.0.1:3000/search/venue/${fixr_id}`;

    fetch(url)
      .then(response => response.json())
      .then(data => setEvents(data.events))
      .catch(error => console.error('Error fetching data:', error));
  }, [title, slug]);

  console.log(events)

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.screenTitle}>{name}</Text>
      {(title === 'Organiser' || title === 'Venue') && events && (
        <ListContainer title="Events:" objects={events} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20, // increase the margin
    color: '#2C3E50', // add a distinct color
  },
  listContainer: {
    paddingHorizontal: 10,
  },
  listTitle: {
    fontSize: 20, // increase the font size slightly
    fontWeight: '700', // making it slightly less bold compared to the main title
    marginBottom: 10,
    paddingVertical: 5, // add vertical padding
    paddingHorizontal: 10, // add horizontal padding
    backgroundColor: '#f0f0f0', // background color for the title
    color: '#333333', // font color
  },
  listItem: {
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1, // less prominent bottom border
    borderColor: '#dddddd', // lighter color for the border
    borderRadius: 5,
    backgroundColor: 'white',
  },
  listItemTitle: {
    fontSize: 16, // a smaller font size for list item title
    fontWeight: '500', // less bold compared to section title
  },
  listItemImage: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 30,
  },
  listItemTextContainer: {
    flex: 1,
  },
  listItemOpenTime: {
    color: '#666',
    fontSize: 14,
  },
  noItems: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
    color: 'gray',
  },
});


export default VorganiserScreen;
