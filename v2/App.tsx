import React from 'react';
import Navigation from './src/Screens/ListingNavigation/Navigation';
import {enableScreens} from 'react-native-screens';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {StripeProvider} from '@stripe/stripe-react-native';

enableScreens(); // ensure screens are enabled for better performance

export default function App() {
  return (
      <StripeProvider
          publishableKey={
            'pk_test_51NJwFSDXdklEKm0R8JRHkohXh2qEKG57G837zZCKOUFXlyjTNkHa2XOSUa0zhN2rQaVkd9NPTykrdC9IRnoBlZ7Z00uMUWz549'
          }>
        <SafeAreaProvider>
          <SafeAreaView style={{flex: 1}}>
            <Navigation/>
          </SafeAreaView>
        </SafeAreaProvider>
      </StripeProvider>
  );
}
