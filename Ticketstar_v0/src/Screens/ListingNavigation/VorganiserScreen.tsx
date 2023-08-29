import React, {useState, useEffect} from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {API_URL_LOCAL, API_URL_PROD} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {convertToGMT} from '../../utilities';
import { BackButton } from "../BackButton";
import { MainColour } from "../../OverallStyles";

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

function VorganiserScreen({navigation, route}) {
  const {fixr_id, name, image_url, city, slug} = route.params;
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(false);
  let title = city == null ? 'Organiser' : 'Venue';

  const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;

  const fetchData = async () => {
    const url =
      title === 'Organiser'
        ? `${apiUrl}/search/organiser?slug=${slug}&organiser_id=${fixr_id}`
        : `${apiUrl}/search/venue/${fixr_id}`;

    setLoading(true);

    const response = await fetch(url);

    const data = await response.json();

    setEvents(data.events);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <BackButton navigation={navigation} goBack={true} styles={{
        color: 'white',
        position: 'absolute',
        top: 10,  // adjust based on your layout
        left: 10, // adjust based on your layout
        padding: 5,  // padding for a larger touch area
        borderRadius: 25, // circular touch area
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}/>
      <Image
        source={{uri: image_url}}
        style={styles.eventImage}
        PlaceholderContent={<ActivityIndicator color={MainColour}/>} // A placeholder component for the image
      />
      <Text style={styles.screenTitle}>{name}</Text>
      {loading ? (
        <ActivityIndicator size="large" color={MainColour} />
      ) : (
        (title === 'Organiser' || title === 'Venue') &&
        events && <ListContainer title="Events:" objects={events} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    color: '#34495E',
  },
  listContainer: {
    padding: 15,
    marginTop: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  listTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2C3E50',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  listItemTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  listItemImage: {
    width: 70,
    height: 70,
    marginLeft: 15,
    borderRadius: 35,
  },
  listItemTextContainer: {
    flex: 1,
    marginRight: 10,  // Adjusting to give space between text and image
  },
  listItemOpenTime: {
    color: '#7f8c8d',
    fontSize: 15,
    marginTop: 5, // a slight margin to separate from the title
  },
  noItems: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 15,
    color: '#bdc3c7',
  },
  eventImage: {
    width: '100%',
    height: 200,  // Fixing the height to be consistent
    borderRadius: 15,
    marginBottom: 20,
    resizeMode: 'cover', // to make sure the image covers the defined width and height
  },
});

export default VorganiserScreen;
