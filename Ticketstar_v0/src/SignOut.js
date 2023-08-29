import AsyncStorage from '@react-native-async-storage/async-storage';

export const SignOut = async navigation => {
  await AsyncStorage.multiRemove([
    'user_id',
    'first_name',
    'surname',
    'email',
    'email_verified',
    'UserListings',
    'UserPurchases',
  ]);

  if (navigation) {

    navigation.goBack();
    navigation.navigate('MainPage');

  }
};
