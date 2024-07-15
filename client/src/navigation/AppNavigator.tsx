import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MyProfileScreen from '../screens/MyProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import ListChatScreen from '../screens/ListChatScreen';
import { Ionicons } from '@expo/vector-icons';
import ListEvent from '../screens/ListEvent';
import UpdateProfile from '../screens/UpdateProfile';
import tw from 'twrnc';
import Events from '../screens/EventsScreen';
import CheckEventsScreen from '../screens/CheckEventsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

export type RootStackParamList = {
  Home: undefined;
  EventDetail: { eventId: string };
  CreateEvent: undefined;
  Login: undefined;
  Register: undefined;
  MyProfile: undefined;
  Chat: { eventId: string };
  MainTabs: undefined;
  UpdateProfile: undefined;
  ListEvent: { category: string };
  Events: undefined;
  CheckEvent: undefined;
  Notifications: undefined
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const CustomTabBarButton = (props: any) => (
  <TouchableOpacity
    {...props}
    style={tw`-mt-5 justify-center items-center`}
  >
    <View style={tw`w-16 h-16 bg-orange-600 rounded-full justify-center items-center shadow-lg`}>
      <Image
        source={require('../../assets/LogoX-Match.png')}
        style={tw`w-12 h-12`}
      />
    </View>
  </TouchableOpacity>
);

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: tw`bg-white border-t border-gray-200`,
        tabBarActiveTintColor: 'orange',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}  
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
          headerShown: false,
        }} 
      />
      <Tab.Screen 
        name="Events" 
        component={Events}  
        options={{
          tabBarLabel: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" color={color} size={size} />
          ),
          headerShown: false,
        }} 
      />
      <Tab.Screen
        name="CreateEventScreen"
        component={CreateEventScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/LogoX-Match.png')}
              style={tw`w-8 h-8`}
            />
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ListChat"
        component={ListChatScreen}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="MyProfile"
        component={MyProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{headerShown: false}}/>
            <Stack.Screen name="Chat" component={ChatScreen} options={{headerShown: false}} />
            <Stack.Screen name="UpdateProfile" component={UpdateProfile} options={{headerShown: false}} />
            <Stack.Screen name="ListEvent" component={ListEvent} options={{ headerShown: false }} />
            <Stack.Screen name="CheckEvent" component={CheckEventsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
