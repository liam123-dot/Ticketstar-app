import React, {useState} from 'react';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image, ActivityIndicator
} from "react-native";
import {useNavigation} from '@react-navigation/native';
import {API_URL_PROD, API_URL_LOCAL} from '@env';
import {formatTimes} from '../../utilities';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { MainColour } from "../../OverallStyles";

const Tab = createMaterialTopTabNavigator();

function ListItem({title, object}) {
  const navigation = useNavigation();

  React.useEffect(() =>
    navigation.addListener('beforeRemove', e => {
      if (!e.data.action.source.includes('Settings')) {
        e.preventDefault();
      }
    }),
  );
  const handlePress = async () => {
    const user_id = await AsyncStorage.getItem('user_id');

    if (title == 'Events') {
      navigation.navigate('Event', {
        fixr_id: object.fixr_id,
        name: object.name,
        image_url: object.image_url,
        venue: object.venue,
        open_time: object.open_time,
        close_time: object.close_time,
        user_id: user_id,
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

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.listItem}>
        <View style={styles.listItemTextContainer}>
          <Text style={styles.listItemTitle}>{object.name}</Text>
          {title === 'Events' && object.open_time && object.close_time && (
            <Text style={styles.listItemSubtitle}>
              {formatTimes(object.open_time, object.close_time)}
            </Text>
          )}
          {object.has_listings ?
            (<Text
            style={{
              color: '#43a047',
              fontWeight: 'bold',
            }}
            >Tickets Available</Text>): <></>
          }
        </View>
        <Image source={{uri: object.image_url}} style={styles.listItemImage} />
      </View>
    </TouchableOpacity>
  );
}

function ListContainer({title, objects}) {
  return (
    <View style={styles.listContainer}>
      {objects ? (
        objects.length > 0 ? (
          objects.map(object => (
            <ListItem key={object.fixr_id} title={title} object={object} />
          ))
        ) : (
          <Text style={styles.noResultsText}>No {title} found</Text>
        )
      ) : (
        <Text style={styles.noResultsText}>Press search to load results</Text>
      )}
    </View>
  );
}

function SearchTab({type, data, loading}) {
  return (
    <View style={styles.container}>
      <ScrollView>
        {loading ? (
            <ActivityIndicator size="large" color={MainColour} />
          ): (
        <ListContainer title={type} objects={data} />)}
      </ScrollView>
    </View>
  );
}

function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [data, setData] = useState({
    Events: null,
    Venues: null,
    Organisers: null,
  });
  const [currentTab, setCurrentTab] = useState('Events');
  const [loading, setLoading] = useState(false);

  const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;

  const handleChangeText = text => {
    setSearchText(text);
  };

  const handleSearch = async tab => {
    if (searchText.length > 0) {
      setLoading(true);
      try {
        if (tab === 'Events') {
          await searchEvents();
          searchVenues();
          searchOrganisers();
        } else if (tab === 'Venues') {
          await searchVenues();
          searchEvents();
          searchOrganisers();
        } else {
          await searchOrganisers();
          searchEvents();
          searchVenues();
        }

      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    }
    setLoading(false);
  };

  const searchEvents = async () => {

    response = await fetch(`${apiUrl}/search/events?query=` + searchText);
    const searchResults = await response.json();

    setData(prevData => ({...prevData, ['Events']: searchResults.events}));

  };

  const searchVenues = async () => {

    response = await fetch(`${apiUrl}/search/venues?query=` + searchText);
    const searchResults = await response.json();

    setData(prevData => ({...prevData, ['Venues']: searchResults.venues}));

  }

  const searchOrganisers = async () => {

    response = await fetch(
      `${apiUrl}/search/organisers?query=` + searchText,
    );
    const searchResults = await response.json();

    setData(prevData => ({...prevData, ['Organisers']: searchResults.organisers}));

  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <View style={{flexDirection: 'row', alignItems: 'center', margin: 5}}>
        <TextInput
          style={[
            styles.searchInput,
          ]}
          placeholder="Search"
          value={searchText}
          onChangeText={handleChangeText}
        />
        <TouchableOpacity style={{marginHorizontal: 10}}>
          <Text
            style={{fontSize: 16, color: '#000'}}
            onPress={() => handleSearch(currentTab)}>
            <AntDesign name={'search1'} size={30} />
          </Text>
        </TouchableOpacity>
      </View>

      <Tab.Navigator
        initialRouteName="Events"
        screenOptions={{
          tabBarStyle: {borderBottomColor: MainColour, borderBottomWidth: 1},
          tabBarActiveTintColor: '#000',
          tabBarInactiveTintColor: 'gray',
        }}>
        <Tab.Screen
          name="Events"
          children={() => <SearchTab type="Events" data={data.Events} loading={loading}/>}
          listeners={{
            focus: () => setCurrentTab('Events'),
          }}
        />
        <Tab.Screen
          name="Venues"
          children={() => <SearchTab type="Venues" data={data.Venues} loading={loading}/>}
          listeners={{
            focus: () => setCurrentTab('Venues'),
          }}
        />
        <Tab.Screen
          name="Organisers"
          children={() => (
            <SearchTab type="Organisers" data={data.Organisers} loading={loading}/>
          )}
          listeners={{
            focus: () => setCurrentTab('Organisers'),
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  searchInput: {
    margin: 5,
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'white',
    flex: 1,
    borderWidth: 1,
    borderColor: MainColour,
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
