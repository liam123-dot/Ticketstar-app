import React, {useState, useEffect} from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {API_URL_LOCAL, API_URL_PROD} from '@env';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {convertToGMT} from "../../utilities";

function ListItem({title, object}) {
  const navigation = useNavigation();

  const handlePress = async () => {
    console.log(object);
    const userId = await AsyncStorage.getItem('user_id');
    navigation.navigate('Event', {
      fixr_id: object.id ? object.id : object.fixr_id,
      name: object.name,
      image_url: object.event_image,
      venue: title,
      open_time: object.open_time,
      user_id: userId,
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.listItem}>
      <View style={styles.listItemTextContainer}>
        <Text style={styles.listItemTitle}>{object.name}</Text>
        {object.open_time && (
          <Text style={styles.listItemOpenTime}>
            {convertToGMT(object.open_time)}
          </Text>
        )}
      </View>
      <Image source={{uri: object.event_image}} style={styles.listItemImage} />
    </TouchableOpacity>
  );
}

function ListContainer({title, objects}) {
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

function VorganiserScreen({route}) {
  const {fixr_id, name, image_url, city, slug} = route.params;
  const [events, setEvents] = useState(null);
  let title = city == null ? 'Organiser' : 'Venue';

  const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;

  useEffect(() => {

    const fetchData = async () => {
      const url =
        title === 'Organiser'
          ? `${apiUrl}/search/organiser?slug=${slug}&organiser_id=${fixr_id}`
          : `${apiUrl}/search/venue/${fixr_id}`;

      const response = await fetch(url);

      const data = await response.json();

      console.log(data);

      setEvents(data.events);

    };

    fetchData();

  }, []);

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
