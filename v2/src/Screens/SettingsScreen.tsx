import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

function SettingsScreen() {

  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const loadDetails = async () => {

    const email = await AsyncStorage.getItem('email');
    const phone_number = await AsyncStorage.getItem('phone_number');

    setEmail(email);
    setPhoneNumber(phone_number);

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

    navigation.navigate("SignIn");
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerText}>Settings</Text>
      </View>

      <View style={styles.settingsItem}>
        <Text style={styles.detailHeader}>
          Email
        </Text>
        <Text style={styles.detailContent}>
          {email}
        </Text>
      </View>

      <View style={styles.settingsItem}>
        <Text style={styles.detailHeader}>
          Phone Number
        </Text>
        <Text style={styles.detailContent}>
          {phoneNumber}
        </Text>
      </View>

      <View style={styles.settingsItem}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={signOut}
        >
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
    alignItems: 'center'
  },
  headerText: {
    fontSize: 20,
    color: '#F5F5F5',
    fontWeight: 'bold',
  },
  settingsItem: {
    flexDirection: 'row', // keep this line
    justifyContent: 'space-between', // add this line
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  detailHeader: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold'
  },
  detailContent: {
    fontSize: 16,
    color: '#444'
  },
  signOutButton: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginLeft: 10,
  },
  signOutText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold'
  }
});


export default SettingsScreen;
