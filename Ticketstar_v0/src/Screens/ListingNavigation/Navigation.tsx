import React from 'react';
import { NavigationContainer, useRoute } from "@react-navigation/native";
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

// Import your screens
import SignInScreen from '../Authentication/SignInScreen';
import SignUpScreen from '../Authentication/SignUpScreen';
import ConfirmVerificationCodeScreen from '../Authentication/ConfirmVerificationCodeScreen';
import SearchScreen from './SearchScreen';
import EventScreen from './EventScreen';
import VorganiserScreen from './VorganiserScreen';
import PostAskScreen from '../Selling/PostAskScreen';
import SettingsScreen from '../SettingsScreen';
import MyListingsScreen from '../Selling/MyListingsScreen';
import MyPurchasesScreen from '../Buying/MyPurchasesScreen';
import MainPage from '../Authentication/MainPage';
import AntDesign from 'react-native-vector-icons/AntDesign';
import ForgotPasswordScreen from '../Authentication/ForgotPasswordScreen';
import PaymentScreen from '../Buying/PaymentScreen';
import {MainColour} from '../../OverallStyles';
import { TouchableOpacity } from "react-native";

const MainStack = createStackNavigator();
const HomeStack = createStackNavigator();
const Tab = createBottomTabNavigator();
const NavigationContext = React.createContext();


function HomeTabs() {

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          height: '8%',
        },
        tabBarShowLabel: false,
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          if (route.name === 'HomeStack') {
            iconName = 'home';
          } else if (route.name === 'Settings') {
            iconName = 'setting';
          } else if (route.name === 'MyPurchases') {
            iconName = 'creditcard';
          } else if (route.name === 'MyListings') {
            iconName = 'tago';
          }

          // You can return any component that you like here!
          // Change the color based on whether the route is focused
          const iconColor = focused ? MainColour : 'black';
          return (
            <AntDesign
              name={iconName}
              size={30}
              color={iconColor}
              style={{top: 10}}
            />
          );
        },
      })}>
      <Tab.Screen
        name="HomeStack"
        component={HomeStackNavigator}
      />
      <Tab.Screen name="MyPurchases" component={MyPurchasesScreen} />
      <Tab.Screen name="MyListings" component={MyListingsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function HomeStackNavigator() {

  return (
    <HomeStack.Navigator screenOptions={{headerShown: false}} >
      <HomeStack.Screen name="Search" component={SearchScreen} />
      <HomeStack.Screen name="Event" component={EventScreen} />
      <HomeStack.Screen name="Vorganiser" component={VorganiserScreen} />
      <HomeStack.Screen name="Post Ask" component={PostAskScreen} />
      <HomeStack.Screen name="Payment Screen" component={PaymentScreen} />
    </HomeStack.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <MainStack.Navigator
        initialRouteName="MainPage"
        screenOptions={{headerShown: false}}>
        <MainStack.Screen name="MainPage" component={MainPage} />
        <MainStack.Screen name="SignIn" component={SignInScreen} />
        <MainStack.Screen name="SignUp" component={SignUpScreen} />
        <MainStack.Screen
          name="ConfirmVerificationCode"
          component={ConfirmVerificationCodeScreen}
        />
        <MainStack.Screen
          name={'ForgotPassword'}
          component={ForgotPasswordScreen}
        />
        <MainStack.Screen
          name="Home"
          options={({navigation}) => ({
            navigation,
          })}>
          {props => (
            <NavigationContext.Provider value={props.navigation}>
              <HomeTabs />
            </NavigationContext.Provider>
          )}
        </MainStack.Screen>
      </MainStack.Navigator>
    </NavigationContainer>
  );
}
