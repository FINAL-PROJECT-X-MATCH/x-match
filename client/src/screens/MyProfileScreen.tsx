import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, RefreshControl, SafeAreaView, Dimensions, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import axiosInstance from '../config/axiosInstance';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface UserProfile {
  username: string;
  email: string;
  avatar?: string;
}

interface Event {
  _id: string;
  name: string;
  player: any[];
  quota: number;
  imageLocation: string;
  date: string;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

const MyProfileScreen: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuth();
  const navigation = useNavigation<NavigationProp<any>>();

  const fetchData = async () => {
    if (!user) {
      console.error('User is not defined');
      return;
    }

    try {
      const [userResponse, eventsResponse] = await Promise.all([
        axiosInstance.get('/user', { headers: { Authorization: `Bearer ${user.token}` } }),
        axiosInstance.get('/user/events', { headers: { Authorization: `Bearer ${user.token}` } })
      ]);
      setUserProfile(userResponse.data);
      
      
      const now = new Date();
      const upcoming = eventsResponse.data.filter((event: Event) => new Date(event.date) > now);
      const past = eventsResponse.data.filter((event: Event) => new Date(event.date) <= now);
      setUpcomingEvents(upcoming);
      setPastEvents(past);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  }, []);

  const handleCardPress = (event: Event) => {
    navigation.navigate('EventDetail', { eventId: event._id });
  };


  const handleUpdateProfile = () => {
    navigation.navigate('UpdateProfile');
  };

  const renderEventCard = (event: Event) => (
    <TouchableOpacity key={event._id} onPress={() => handleCardPress(event)}>
      <View style={[tw`mr-4 bg-white rounded-2xl overflow-hidden`, { width: CARD_WIDTH }, styles.cardShadow]}>
        <Image source={{ uri: event.imageLocation }} style={tw`w-full h-48`} />
        <BlurView intensity={80} tint="dark" style={tw`absolute bottom-0 left-0 right-0 p-4`}>
          <Text style={tw`text-lg font-bold text-white mb-1`}>{event.name}</Text>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <MaterialCommunityIcons name="account-group" size={18} color="#fff" />
              <Text style={tw`ml-1 text-sm text-white`}>
                {event.player.length}/{event.quota}
              </Text>
            </View>
            <Text style={tw`text-sm text-white`}>{new Date(event.date).toLocaleDateString()}</Text>
          </View>
        </BlurView>
      </View>
    </TouchableOpacity>
  );

  return (
   
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <LinearGradient
          colors={['rgb(249 115 22)', 'rgb(234 88 12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tw`pt-12 pb-24 px-4`}
        >
          <View style={tw`flex-row justify-end mb-6`}>
            <TouchableOpacity onPress={handleUpdateProfile} style={tw`bg-white/20 rounded-full p-2`}>
              <Feather name="edit" size={20} color="white" />
            </TouchableOpacity>
          </View>
          <View style={tw`items-center`}>
            {userProfile?.avatar ? (
              <Image source={{ uri: userProfile.avatar }} style={[tw`w-32 h-32 rounded-full border-4 border-white`, styles.avatarShadow]} />
            ) : (
              <View style={[tw`w-32 h-32 rounded-full bg-orange-300 items-center justify-center border-4 border-white`, styles.avatarShadow]}>
                <Ionicons name="person" size={64} color="rgb(249 115 22)" />
              </View>
            )}
            <Text style={tw`mt-4 text-3xl font-bold text-white`}>{userProfile?.username}</Text>
            <Text style={tw`mt-1 text-base text-orange-100`}>{userProfile?.email}</Text>
          </View>
        </LinearGradient>

        <View style={[tw`-mt-16 mx-4 bg-white rounded-3xl shadow-lg p-6`, styles.statsContainer]}>
          <Text style={tw`text-xl font-bold mb-4 text-gray-800`}>Your Stats</Text>
          <View style={tw`flex-row justify-between`}>
            <View style={tw`items-center`}>
              <Text style={tw`text-2xl font-bold text-orange-600`}>{upcomingEvents.length}</Text>
              <Text style={tw`text-sm text-gray-600`}>Upcoming</Text>
            </View>
            <View style={tw`items-center`}>
              <Text style={tw`text-2xl font-bold text-orange-600`}>{pastEvents.length}</Text>
              <Text style={tw`text-sm text-gray-600`}>History</Text>
            </View>
          </View>
        </View>

        <View style={tw`mt-6 px-4`}>
          <Text style={tw`text-xl font-bold mb-4 text-gray-800`}>Upcoming Events</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`pb-4`}
          >
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(renderEventCard)
            ) : (
              <Text style={tw`text-gray-500 text-center w-full`}>No upcoming events</Text>
            )}
          </ScrollView>
        </View>

        <View style={tw`mt-6 px-4`}>
          <Text style={tw`text-xl font-bold mb-4 text-gray-800`}>Event History</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`pb-4`}
          >
            {pastEvents.length > 0 ? (
              pastEvents.map(renderEventCard)
            ) : (
              <Text style={tw`text-gray-500 text-center w-full`}>No past events</Text>
            )}
          </ScrollView>
        </View>

      
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  avatarShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  statsContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButton: {
    shadowColor: "rgb(249 115 22)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default MyProfileScreen;