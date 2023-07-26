import React, {useEffect} from 'react';
import Navigation from './src/Screens/ListingNavigation/Navigation';
import {enableScreens} from 'react-native-screens';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {StripeProvider} from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_URL_PROD, API_URL_LOCAL} from '@env';
import MainPage from "./src/Screens/Authentication/MainPage";

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

        let sellerVerified;

        if (!user_has_stripe || action_required) {
          sellerVerified = false;
        } else {
          sellerVerified = true;
        }
        console.log(sellerVerified)
        await AsyncStorage.setItem('SellerVerified', String(sellerVerified));
      }
    };

    loadData();

  }, []);

  return (
    <StripeProvider
      publishableKey={
        'pk_test_51NJwFSDXdklEKm0R8JRHkohXh2qEKG57G837zZCKOUFXlyjTNkHa2XOSUa0zhN2rQaVkd9NPTykrdC9IRnoBlZ7Z00uMUWz549'
      }>
      <SafeAreaProvider>
        <SafeAreaView style={{flex: 1}}>
          <Navigation />
        </SafeAreaView>
      </SafeAreaProvider>
    </StripeProvider>
  );
}
