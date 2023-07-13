import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import your screens
import SignInScreen from '../Authentication/SignInScreen';
import SignUpScreen from '../Authentication/SignUpScreen';
import ConfirmVerificationCodeScreen from '../Authentication/ConfirmVerificationCodeScreen';
import SearchScreen from './SearchScreen';
import EventScreen from './EventScreen';
import VorganiserScreen from './VorganiserScreen';
import PostAskScreen from '../Selling/PostAskScreen';
import SettingsScreen from '../SettingsScreen';
import MyListingsScreen from "../Selling/MyListingsScreen";
import BuyingScreen from "../Buying/BuyingScreen";
import MyPurchasesScreen from "../Buying/MyPurchasesScreen";

const MainStack = createStackNavigator();
const HomeStack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator screenOptions={{headerShown: false}}>
      <Tab.Screen name="HomeStack" component={HomeStackNavigator} />
      <Tab.Screen name="MyPurchases" component={MyPurchasesScreen} />
      <Tab.Screen name="MyListings" component={MyListingsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{headerShown: false}}>
      <HomeStack.Screen name="Search" component={SearchScreen} />
      <HomeStack.Screen name="Event" component={EventScreen} />
      <HomeStack.Screen name="Vorganiser" component={VorganiserScreen} />
      <HomeStack.Screen name="Post Ask" component={PostAskScreen} />
      <HomeStack.Screen name="Buy" component={BuyingScreen}/>
    </HomeStack.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <MainStack.Navigator initialRouteName="SignIn" screenOptions={{headerShown: false}}>
        <MainStack.Screen name="SignIn" component={SignInScreen} />
        <MainStack.Screen name="SignUp" component={SignUpScreen} />
        <MainStack.Screen name="ConfirmVerificationCode" component={ConfirmVerificationCodeScreen} />
        <MainStack.Screen name="Home" component={HomeTabs} />
      </MainStack.Navigator>
    </NavigationContainer>
  );
}
