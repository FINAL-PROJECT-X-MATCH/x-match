import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Image, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MaterialIcons, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axiosInstance from '../config/axiosInstance';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';

type ListEventScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ListEvent'>;
type ListEventScreenRouteProp = RouteProp<RootStackParamList, 'ListEvent'>;

type Props = {
  navigation: ListEventScreenNavigationProp;
  route: ListEventScreenRouteProp;
};

const ListEvent: React.FC<Props> = ({ navigation, route }) => {
  const { category } = route.params;
  const [events, setEvents] = useState<any[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'nearest'>('newest');
  const { user } = useAuth();

  const fetchEvents = useCallback(async () => {
    if (user && user.token) {
      try {
        const response = await axiosInstance.get('/events', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setEvents(response.data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const sortEvents = () => {
    let sortedEvents = events.filter(event => category === 'All' || event.category.toLowerCase() === category.toLowerCase());
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
        return <Ionicons name="football" size={16} color="rgb(249 115 22)" />;
      case 'futsal':
        return <MaterialCommunityIcons name="soccer" size={16} color="rgb(249 115 22)" />;
      case 'gym':
        return <MaterialCommunityIcons name="dumbbell" size={16} color="rgb(249 115 22)" />;
      case 'basketball':
        return <MaterialCommunityIcons name="basketball" size={16} color="rgb(249 115 22)" />;
      default:
        return <MaterialIcons name="sports" size={16} color="rgb(249 115 22)" />;
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRadians = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // Radius of the Earth in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(price);
  };

  const renderEventItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('EventDetail', { eventId: item._id })} 
      style={tw`mb-4`}
    >
      <View style={tw`bg-white rounded-3xl overflow-hidden shadow-lg`}>
        <Image source={{ uri: item.imageLocation }} style={tw`w-full h-48`} />
        <LinearGradient
          colors={['#e0eafc', '#cfdef3']}
          style={tw`absolute top-0 left-0 right-0 h-16`}
        />
        <View style={tw`absolute top-2 right-2 bg-white rounded-full p-2`}>
          <FontAwesome name="heart-o" size={20} color="#f97316" />
        </View>
        <View style={tw`p-3`}>
          <Text style={tw`text-base font-bold mb-1 text-black`}>{item.name}</Text>
          <View style={tw`flex-row items-center mb-2`}>
            {getCategoryIcon(item.category)}
            <Text style={tw`text-xs text-gray-600 ml-1`}>{item.category}</Text>
          </View>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <Ionicons name="calendar-outline" size={14} color="rgb(249 115 22)" />
              <Text style={tw`ml-1 text-xs text-gray-500`}>{formatDate(item.date)}</Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <FontAwesome name="users" size={14} color="rgb(249 115 22)" />
              <Text style={tw`ml-1 text-xs text-[#f97316]`}>{`${item.player.length}/${item.quota}`}</Text>
            </View>
          </View>
          {location && (
            <View style={tw`flex-row items-center justify-start mt-2`}>
              <Ionicons name="location-outline" size={14} color="#f97316" />
              <Text style={tw`ml-1 text-xs text-gray-500`}>{`${getDistance(item)} km`}</Text>
            </View>
          )}
          <View style={tw`flex-row items-center justify-start mt-2`}>
            <Ionicons name="pricetag-outline" size={14} color="rgb(249 115 22)" />
            <Text style={tw`ml-1 text-xs text-gray-700`}>{item.price === 'free' ? 'Free' : formatPrice(item.price)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator style={tw`flex-1`} size="large" color="#f97316" />;
  }

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <LinearGradient colors={['rgb(249 115 22)', 'rgb(234 88 12)']} style={tw`pt-12 pb-6 px-4 rounded-b-3xl`}>
        <View style={tw`flex-row items-center justify-between`}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2`}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={tw`text-3xl font-bold text-white`}>{category} Events</Text>
          <View style={tw`p-2`}></View>
        </View>
        <View style={tw`flex-row justify-between mt-4`}>
          <TouchableOpacity onPress={() => setSortOption('newest')} style={tw`px-6 py-3 rounded-full ${sortOption === 'newest' ? 'bg-orange-500' : 'bg-gray-100'}`}>
            <Text style={tw`${sortOption === 'newest' ? 'text-white' : 'text-black'}`}>Newest</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSortOption('oldest')} style={tw`px-6 py-3 rounded-full ${sortOption === 'oldest' ? 'bg-orange-500' : 'bg-gray-100'}`}>
            <Text style={tw`${sortOption === 'oldest' ? 'text-white' : 'text-black'}`}>Oldest</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSortOption('nearest')} style={tw`px-6 py-3 rounded-full ${sortOption === 'nearest' ? 'bg-orange-500' : 'bg-gray-100'}`}>
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
            colors={['#f97316']}
          />
        }
        ListHeaderComponent={() => (
          <Text style={tw`text-3xl font-bold text-black mb-6`}>All Events - {category}</Text>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default ListEvent;
