import { Alert } from "react-native";
import {API_URL_PROD, API_URL_LOCAL} from '@env';

export const fetchPricing = async (ask_id) => {
  let response;
  const apiUrl = __DEV__ ? API_URL_LOCAL: API_URL_PROD;
  if (ask_id) {
    response = await fetch(`${apiUrl}/fees?ask_id=${ask_id}`, {
      method: 'GET',
    });
  } else {
    response = await fetch(`${apiUrl}/fees`, {
      method: 'GET',
    });
  }
  const data = await response.json();

  if (response.ok) {
    const havePlatformFee = data.platform_fixed_fee + data.platform_variable_fee > 0;

    return {
      pricingID: data.pricing_id,
      stripeFixedFee: data.stripe_fixed_fee,
      stripeVariableFee: data.stripe_variable_fee,
      platformFixedFee: data.platform_fixed_fee,
      platformVariableFee: data.platform_variable_fee,
      areFeesLoaded: true,
      havePlatformFee
    };
  } else {
    throw new Error('Issue loading pricing, please try again.');
  }
};

