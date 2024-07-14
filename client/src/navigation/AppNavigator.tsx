import React from 'react';
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
import CustomTabButton from '../components/CustomTabButton';
import ListChatScreen from '../screens/ListChatScreen';
import { Ionicons } from '@expo/vector-icons';
import ListEvent from '../screens/ListEvent';

export type RootStackParamList = {
  Home: undefined;
  EventDetail: { eventId: string };
  CreateEvent: undefined;
  Login: undefined;
  Register: undefined;
  MyProfile: undefined;
  Chat: { eventId: string };
  MainTabs: undefined
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen}  options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
          headerShown: false,
        }} />
      <Tab.Screen name="ListEvent" component={ListEvent}  options={{
          tabBarLabel: 'List Event',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" color={color} size={size} />
          ),
          headerShown: false,
        }} />
      <Tab.Screen
        name="CreateEventScreen"
        component={CreateEventScreen}
        options={{
          tabBarLabel: 'Create Event',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ListChat"
        component={ListChatScreen}
        options={{
          tabBarLabel: 'List Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbox-ellipses-outline" color={color} size={size} />
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
            <Ionicons name="person" color={color} size={size} />
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
