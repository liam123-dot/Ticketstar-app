import React, {useEffect} from 'react';
import Navigation from './src/Screens/ListingNavigation/Navigation';
import {enableScreens} from 'react-native-screens';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {StripeProvider} from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_URL_PROD, API_URL_LOCAL} from '@env';

enableScreens(); // ensure screens are enabled for better performance

export default function App() {
  useEffect(() => {
    const loadData = async () => {
      const apiUrl = __DEV__ ? API_URL_LOCAL : API_URL_PROD;

      const user_id = await AsyncStorage.getItem('user_id');

      console.log(user_id)

      const sellerEnabledResponse = await fetch(
        `${apiUrl}/CheckUserConnectedAccount`,
        {
          method: "POST",
          body: JSON.stringify({
            'user_id': user_id,
          })
        }
      );

      if (sellerEnabledResponse.ok) {
        const data = await sellerEnabledResponse.json();

        const user_has_stripe = data.user_has_stripe;
        const action_required = data.further_action_required;

        if (!user_has_stripe || action_required) {
          await AsyncStorage.setItem('SellerVerified', String(false));
        } else {
          await AsyncStorage.setItem('SellerVerified', String(true));
        }

        console.log(await AsyncStorage.getItem("SellerVerified"));
      }
    };

    loadData();

  }, []);

  return (
    <StripeProvider
      publishableKey={
        'pk_live_51NJwFSDXdklEKm0RH9UR7RgQ2kPsEQvbFaSJKVl5PnBMNWVIVT88W4wMIo8IIm9A6TvKOBOVV4xPSN9tvPMHAZOJ00uA9XSbKi'
      }>
      <SafeAreaProvider>
        <SafeAreaView style={{flex: 1}}>
          <Navigation />
        </SafeAreaView>
      </SafeAreaProvider>
    </StripeProvider>
  );
}
