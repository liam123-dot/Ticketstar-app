import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {API_URL_PROD, API_URL_LOCAL} from '@env';

function SettingsScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sellerEnabled, setSellerEnabled] = useState('');

  const [firstName, setFirstName] = useState(null);
  const [surname, setSurname] = useState(null);

  const loadDetails = async () => {
    const email = await AsyncStorage.getItem('email');
    const phone_number = await AsyncStorage.getItem('phone_number');
    const sellerEnabled = (await AsyncStorage.getItem('SellerVerified')) === 'true';

    const first_name = await AsyncStorage.getItem('first_name');
    const surname = await AsyncStorage.getItem('surname');

    setEmail(email);
    setPhoneNumber(phone_number);
    setSellerEnabled(sellerEnabled);

    setFirstName(first_name);
    setSurname(surname);
  };

  useEffect(() => {
    loadDetails();
  });

  const signOut = async () => {
    await AsyncStorage.multiRemove([
      'user_id',
      'first_name',
      'surname',
      'email',
      'phone_number',
      'email_verified',
      'phone_number_verified',
    ]);

    navigation.navigate('MainPage');
  };

  const becomeSeller = async () => {
    const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;

    const keys = ['user_id', 'first_name', 'surname', 'email', 'phone_number'];
    const [
      [, user_id],
      [, first_name],
      [, surname],
      [, email],
      [, phone_number],
    ] = await AsyncStorage.multiGet(keys);

    const response = await fetch(`${apiUrl}/CreateConnectedAccount`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: user_id,
        first_name: first_name,
        last_name: surname,
        email: email,
        phone_number: phone_number,
      }),
    });

    const data = await response.json();
    const link = data.link;

    console.log(link);

    if (link == null) {
      await AsyncStorage.setItem('SellerVerified', 'true');
    }

    await Linking.openURL(link);
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.settingsItem}>
        <Text style={styles.detailHeader}>First Name</Text>
        <Text style={styles.detailContent}>{firstName}</Text>
      </View>

      <View style={styles.settingsItem}>
        <Text style={styles.detailHeader}>Surname</Text>
        <Text style={styles.detailContent}>{surname}</Text>
      </View>

      <View style={styles.settingsItem}>
        <Text style={styles.detailHeader}>Email</Text>
        <Text style={styles.detailContent}>{email}</Text>
      </View>

      <View style={styles.settingsItem}>
        <Text style={styles.detailHeader}>Phone Number</Text>
        <Text style={styles.detailContent}>{phoneNumber}</Text>
      </View>

      {!sellerEnabled && (
        <View style={styles.settingsItem}>
          <TouchableOpacity
            style={[styles.button, {backgroundColor: '#43a047'}]}
            onPress={becomeSeller}>
            <Text style={styles.signOutText}>Become a Seller</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.settingsItem}>
        <TouchableOpacity style={styles.button} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
});

export default SettingsScreen;
