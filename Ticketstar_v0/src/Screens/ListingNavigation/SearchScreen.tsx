import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image, ActivityIndicator, RefreshControl
} from "react-native";
import {useNavigation} from '@react-navigation/native';
import {API_URL_PROD, API_URL_LOCAL} from '@env';
import {formatTimes} from '../../utilities';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainColour } from "../../OverallStyles";

function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [data, setData] = useState({
    Events: null,
    Venues: null,
    Organisers: null,
  });

  React.useEffect(() => {
    fetchPopularEvents();
  }, []);

  const [popularEvents, setPopularEvents] = useState(null);

  const [loadingPopularEvents, setLoadingPopularEvents] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [loadingOrganisers, setLoadingOrganisers] = useState(false);

  const [loadingMoreEvents, setLoadingMoreEvents] = useState(false);

  const [eventsOffset, setEventsOffset] = useState(0);

  const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;

  const handleChangeText = text => {
    setSearchText(text);
  };

  const handleSearch = async () => {
    data.Events = {};
    if (searchText.length > 0) {
      try {

        setEventsOffset(0);

        searchEvents();
        searchVenues();
        searchOrganisers();

      } catch (error) {
        console.error(error);
      }
    }
  };

  const fetchPopularEvents = async () => {
    setLoadingPopularEvents(true);
    const userId = await AsyncStorage.getItem('user_id');
    try {
      const response = await fetch('https://npbts5ezmi.execute-api.eu-west-2.amazonaws.com/Prod/search/GetPopularEvents', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
        })
      });
      const results = await response.json();
      setPopularEvents(results.events); // assuming the API returns an array
    } catch (error) {
      console.error("Failed to fetch popular events:", error);
    }
    setLoadingPopularEvents(false);
  };


  const searchEvents = async (showMore = false) => {
    if (showMore) {
      setLoadingMoreEvents(true);
    } else {
      setLoadingEvents(true);
    }
    const userID = await AsyncStorage.getItem('user_id');

    let newOffset = showMore ? eventsOffset + 4 : 0;
    setEventsOffset(newOffset);

    response = await fetch(`${apiUrl}/search/events?query=${searchText}&limit=4&offset=${newOffset}`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userID,
      }),
    });
    const searchResults = await response.json();

    if (showMore) {
      setData(prevData => ({ ...prevData, ['Events']: [...prevData.Events, ...searchResults.events] }));
    } else {
      setData(prevData => ({ ...prevData, ['Events']: searchResults.events }));
    }

    if (showMore) {
      setLoadingMoreEvents(false);
    } else {
      setLoadingEvents(false);
    }
  };


  const searchVenues = async () => {

    setLoadingVenues(true);

    response = await fetch(`${apiUrl}/search/venues?query=` + searchText);
    const searchResults = await response.json();

    setData(prevData => ({...prevData, ['Venues']: searchResults.venues}));

    setLoadingVenues(false);

  }

  const searchOrganisers = async () => {

    setLoadingOrganisers(true);

    response = await fetch(
      `${apiUrl}/search/organisers?query=` + searchText,
    );
    const searchResults = await response.json();

    setData(prevData => ({...prevData, ['Organisers']: searchResults.organisers}));

    setLoadingOrganisers(false);

  }

  const handleRefresh = () => {
    setData({
      Events: null,
      Venues: null,
      Organisers: null,
    });
    setSearchText('');
    fetchPopularEvents();
  }

  const handleClear = () => {
    setSearchText('');
  };

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

      if (title === 'Events' || title === 'Popular Events') {
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
                {formatTimes(object.open_time*1000.0, object.close_time*1000.0)}
              </Text>
            )}
            {title === 'Popular Events' && object.open_time && object.close_time && (
              <Text style={styles.listItemSubtitle}>
                {formatTimes(object.open_time*1000.0, object.close_time*1000.0)}
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
          <Text style={styles.noResultsText}>No {title} found</Text>
        )}

        { title === 'Events' &&

          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => {
              searchEvents(true);
            }}
          >
            {loadingMoreEvents ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.showMoreText}>Show More</Text>
            )}
          </TouchableOpacity>
        }
      </View>
    );
  }

  function SearchTab({type, data, loading}) {
    return (
      <View style={styles.container}>
        <View style={styles.listTitleContainer}>
          <Text style={styles.listTitle}>{type}</Text>
          <View style={styles.titleUnderline}></View>
        </View>
        <ScrollView>
          {loading ? (
            <ActivityIndicator size="large" color={MainColour} />
          ): (
            <ListContainer title={type} objects={data} />)}
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="black"
          value={searchText}
          onChangeText={handleChangeText}
          returnKeyType={'search'}
          onSubmitEditing={handleSearch}
        />
        {searchText ? (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>X</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        refreshControl={
          // include the RefreshControl component in ScrollView
          <RefreshControl refreshing = {loadingPopularEvents} onRefresh={handleRefresh} tintColor={MainColour}/>
        }>
        {(data.Events || data.Venues || data.Organisers) ? (
          <>
            <SearchTab type="Events" data={data.Events} loading={loadingEvents} />
            <SearchTab type="Venues" data={data.Venues} loading={loadingVenues} />
            <SearchTab type="Organisers" data={data.Organisers} loading={loadingOrganisers} />
          </>
        ) : (
            <SearchTab type="Popular Events" data={popularEvents}/>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  showMoreButton: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '30%',
    backgroundColor: MainColour,
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  showMoreText: {
    color: 'white',
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 10,
  },
  clearButtonText: {
    fontSize: 10,
    color: 'white', // Change the color here
  },
  listTitleContainer: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',  // Optional: If you'd like a background color for the title section
  },
  listTitle: {
    fontWeight: 'bold',
    fontSize: 24,  // Bigger font size
    color: MainColour,  // Consider using your main color
    marginVertical: 8,
  },
  titleUnderline: {
    width: 60,  // Length of the underline
    height: 3,  // Thickness of the underline
    backgroundColor: MainColour,  // Color of the underline
    marginTop: 3,
  },
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

  clearButton: {
    position: 'absolute',
    right: 15,  // Adjust as needed
    top: '50%',  // Centers the button vertically
    transform: [{ translateY: -10 }],  // Half of button height to ensure it's centered
    width: 20,
    height: 20,
    borderRadius: 15,
    backgroundColor: 'grey',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearIcon: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SearchScreen;
