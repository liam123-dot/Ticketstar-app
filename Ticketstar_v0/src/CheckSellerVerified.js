import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {API_URL_PROD} from '@env'

export const CheckSellerVerified = async () => {

  const apiUrl = API_URL_PROD;

  const user_id = await AsyncStorage.getItem('user_id')

  const sellerEnabledResponse = await fetch(
    `${apiUrl}/CheckUserConnectedAccount`,
    {
      method: 'POST',
      body: JSON.stringify({
        user_id: user_id,
      }),
    },
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
    await AsyncStorage.setItem('SellerVerified', String(sellerVerified));
  } else {
    await AsyncStorage.setItem('SellerVerified', String(false));
  }
};
