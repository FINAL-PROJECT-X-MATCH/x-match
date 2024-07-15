import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, FlatList, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MaterialIcons, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axiosInstance from '../config/axiosInstance';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';

type EventsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Events'>;

type Props = {
  navigation: EventsScreenNavigationProp;
};

const Events: React.FC<Props> = ({ navigation }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'nearest'>('newest');
  const [searchText, setSearchText] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      if (user && user.token) {
        try {
          const response = await axiosInstance.get('/events', {
            headers: { Authorization: `Bearer ${user.token}` }
          });

          setEvents(response.data);
          setFilteredEvents(response.data);
          setLoading(false);
        } catch (error) {
          console.error(error);
          setLoading(false);
        }
      }
    };

    fetchEvents();
  }, [user]);

  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    };

    getLocation();
  }, []);

  useEffect(() => {
    const today = new Date()
    const oneDayAfter = new Date()
    oneDayAfter.setDate(today.getDate() + 1)
    const twoDayAfter = new Date()
    twoDayAfter.setDate(today.getDate() + 2)
   
    const filtered = events.filter(event => event.name.toLowerCase().includes(searchText.toLowerCase()));
    const newFilter = filtered.filter(event => new Date(event.date) > twoDayAfter)
    
    setFilteredEvents(newFilter);
  }, [searchText, events]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user && user.token) {
      try {
        const response = await axiosInstance.get('/events', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setEvents(response.data);
        setFilteredEvents(response.data);
      } catch (error) {
        console.error(error);
      }
    }
    setRefreshing(false);
  };

  const sortEvents = () => {
    let sortedEvents = [...filteredEvents];
    if (sortOption === 'newest') {
      sortedEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortOption === 'oldest') {
      sortedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortOption === 'nearest' && location) {
      sortedEvents.sort((a, b) => {
        const distanceA = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          a.location.latitude,
          a.location.longitude
        );
        const distanceB = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          b.location.latitude,
          b.location.longitude
        );
        return distanceA - distanceB;
      });
    }
    return sortedEvents;
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'football':
        return <Ionicons name="football" size={16} color="#4F46E5" />;
      case 'futsal':
        return <MaterialCommunityIcons name="soccer" size={16} color="#4F46E5" />;
      case 'gym':
        return <MaterialCommunityIcons name="dumbbell" size={16} color="#4F46E5" />;
      case 'basketball':
        return <MaterialCommunityIcons name="basketball" size={16} color="#4F46E5" />;
      default:
        return <MaterialIcons name="sports" size={16} color="#4F46E5" />;
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRadians = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  };

  const getDistance = (event: any) => {
    if (!location) return null;
    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      event.location.latitude,
      event.location.longitude
    );
    return distance.toFixed(2);
  };

  const renderEventItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('EventDetail', { eventId: item._id })} 
      style={tw`mb-4`}
    >
      <LinearGradient
        colors={['#e0eafc', '#cfdef3']}
        style={tw`bg-white rounded-3xl overflow-hidden shadow-lg`}
      >
        <Image source={{ uri: item.imageLocation }} style={tw`w-full h-48`} />
        <View style={tw`p-3`}>
          <Text style={tw`text-base font-bold mb-1 text-black`}>{item.name}</Text>
          <View style={tw`flex-row items-center mb-2`}>
            {getCategoryIcon(item.category)}
            <Text style={tw`text-xs text-gray-600 ml-1`}>{item.category}</Text>
          </View>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <Ionicons name="calendar-outline" size={14} color="#4F46E5" />
              <Text style={tw`ml-1 text-xs text-gray-500`}>{formatDate(item.date)}</Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <FontAwesome name="users" size={14} color="#4F46E5" />
              <Text style={tw`ml-1 text-xs text-[#4F46E5]`}>{`${item.player.length}/${item.quota}`}</Text>
            </View>
          </View>
          {location && (
            <View style={tw`flex-row items-center justify-start mt-2`}>
              <Ionicons name="location-outline" size={14} color="#4F46E5" />
              <Text style={tw`ml-1 text-xs text-gray-500`}>{`${getDistance(item)} km`}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator style={tw`flex-1`} size="large" color="#4F46E5" />;
  }

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <LinearGradient colors={['#4F46E5', '#818CF8']} style={tw`pt-12 pb-6 px-4 rounded-b-3xl`}>
        <View style={tw`bg-white rounded-full px-4 py-3 shadow-lg flex-row items-center`}>
          <MaterialIcons name="search" size={24} color="#4F46E5" />
          <TextInput
            placeholder="Search events..."
            value={searchText}
            onChangeText={setSearchText}
            style={tw`flex-1 ml-3 text-base text-black`}
            placeholderTextColor="#A0AEC0"
          />
        </View>
        <View style={tw`flex-row justify-between mt-4`}>
          <TouchableOpacity onPress={() => setSortOption('newest')} style={tw`px-6 py-3 rounded-full ${sortOption === 'newest' ? 'bg-[#4F46E5]' : 'bg-gray-100'}`}>
            <Text style={tw`${sortOption === 'newest' ? 'text-white' : 'text-black'}`}>Newest</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSortOption('oldest')} style={tw`px-6 py-3 rounded-full ${sortOption === 'oldest' ? 'bg-[#4F46E5]' : 'bg-gray-100'}`}>
            <Text style={tw`${sortOption === 'oldest' ? 'text-white' : 'text-black'}`}>Oldest</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSortOption('nearest')} style={tw`px-6 py-3 rounded-full ${sortOption === 'nearest' ? 'bg-[#4F46E5]' : 'bg-gray-100'}`}>
            <Text style={tw`${sortOption === 'nearest' ? 'text-white' : 'text-black'}`}>Nearest</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        style={tw`flex-1 px-4 pt-4`}
        data={sortEvents()}
        keyExtractor={(item) => item._id}
        renderItem={renderEventItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4F46E5']}
          />
        }
        ListHeaderComponent={() => (
          <Text style={tw`text-3xl font-bold text-black mb-6`}>All Events</Text>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default Events;
