import React, {useEffect, useState} from 'react';
import {
  Alert,
  Linking, RefreshControl,
  SafeAreaView, ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {API_URL_LOCAL, API_URL_PROD} from '@env';
import { handleTransfer } from "../TicketTransfer";
import { MainColour } from "../OverallStyles";
import { SignOut } from "../SignOut";

function SettingsScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [sellerEnabled, setSellerEnabled] = useState('');

  const [firstName, setFirstName] = useState(null);
  const [surname, setSurname] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;
  // const apiUrl = API_URL_PROD;

  const loadDetails = async () => {
    const email = await AsyncStorage.getItem('email');
    const sellerEnabled =
      (await AsyncStorage.getItem('SellerVerified')) === 'true';

    const first_name = await AsyncStorage.getItem('first_name');
    const surname = await AsyncStorage.getItem('surname');

    setEmail(email);
    setSellerEnabled(sellerEnabled);

    setFirstName(first_name);
    setSurname(surname);

  };

  const handleRefresh = () => {

  }

  useEffect(() => {
    loadDetails();
  });

  const becomeSeller = async () => {

    const getSetupUrl = async () => {

      const keys = [
        'user_id',
        'first_name',
        'surname',
        'email',
      ];
      const [
        [, user_id],
        [, first_name],
        [, surname],
        [, email],
      ] = await AsyncStorage.multiGet(keys);

      const response = await fetch(`${apiUrl}/CreateConnectedAccount`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: user_id,
          first_name: first_name,
          last_name: surname,
          email: email,
        }),
      });

      const data = await response.json();
      console.log(data);

      const link = data.link;

      if (response.ok) {

        if (link == null) {
          await AsyncStorage.setItem('SellerVerified', String(true));
          return false;
        } else {
          return link
        }
      }

    };

    setRefreshing(true);
    const setupUrl = await getSetupUrl();
    setRefreshing(false);

    if (setupUrl){
      await Linking.openURL(setupUrl);
    } else {
      await AsyncStorage.setItem('SellerVerified', String(true));
      Alert.alert('You already have a Stripe account');
    }

  };

  const forwardToStripe = async () => {
    await Linking.openURL('https://dashboard.stripe.com/login');
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        // include the RefreshControl component in ScrollView
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={MainColour}/>
      }>
      <View style={styles.settingsItem}>
        <Text style={styles.detailHeader}>First Name</Text>
        <Text style={styles.detailContent}>{firstName}</Text>
      </View>

      <View style={styles.settingsItem}>
        <Text style={styles.detailHeader}>Last Name</Text>
        <Text style={styles.detailContent}>{surname}</Text>
      </View>

      <View style={styles.settingsItem}>
        <Text style={styles.detailHeader}>Email</Text>
        <Text style={styles.detailContent}>{email}</Text>
      </View>

      {!sellerEnabled ? (
        <View style={styles.settingsItem}>
          <TouchableOpacity
            style={[styles.button, {backgroundColor: '#43a047'}]}
            onPress={becomeSeller}>
            <Text style={styles.signOutText}>Become a Seller</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() =>
              Alert.alert(
                'Creating a Stripe Account',
                'We use Stripe to take payments from buyers, and payout to sellers. This is a one time process. We have prefilled most of the required information',
              )
            }>
            <Text style={styles.infoButtonText}>?</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.settingsItem}>
          <TouchableOpacity
            style={[styles.button, {backgroundColor: '#43a047'}]}
            onPress={forwardToStripe}>
            <Text style={styles.signOutText}>Proceed to Stripe</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.settingsItem}>
        <TouchableOpacity
          style={[styles.button, {backgroundColor: '#43a047'}]}
          onPress={() =>
            Linking.openURL('https://ticketstar.uk/contact-us')
          }>
          <Text
           style={styles.signOutText}
          >
            Contact
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, {backgroundColor: '#43a047'}]}
          onPress={() =>
            Linking.openURL('https://ticketstar.uk/help')
          }>
          <Text
            style={styles.signOutText}
          >
            FAQ's
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingsItem}>
        <TouchableOpacity style={styles.button} onPress={() => {
          SignOut(navigation);
        }}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#4F6D7A',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    color: 'black',
    fontWeight: 'bold',
  },
  settingsItem: {
    flexDirection: 'row', // keep this line
    justifyContent: 'space-between', // add this line
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  detailHeader: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  detailContent: {
    fontSize: 16,
    color: '#444',
  },
  button: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginLeft: 10,
  },
  signOutText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  infoButton: {
    width: 25,
    height: 25,
    borderRadius: 15,
    backgroundColor: '#95A1F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  infoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
