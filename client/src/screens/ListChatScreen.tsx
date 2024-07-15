import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import axiosInstance from '../config/axiosInstance';
import { useAuth } from '../context/AuthContext';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';

type ListChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

const ListChatScreen: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation<ListChatScreenNavigationProp>();

  const fetchJoinedEvents = useCallback(async () => {
    if (user && user.token) {
      try {
        const response = await axiosInstance.get('/user/joined-events', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const eventsData = response.data;

        // Fetch the latest messages for each event
        const eventsWithMessages = await Promise.all(eventsData.map(async (event: any) => {
          const messagesResponse = await axiosInstance.get(`/chats/${event._id}`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          const latestMessage = messagesResponse.data.length > 0 ? messagesResponse.data[0] : null;
          return { ...event, latestMessage };
        }));
        const filterListChat = eventsWithMessages.filter(list => new Date(list.date) > new Date())

        setEvents(filterListChat);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchJoinedEvents();
    }, [fetchJoinedEvents])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJoinedEvents();
    setRefreshing(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'football':
        return <Ionicons name="football" size={24} color="#4F46E5" style={tw`mr-4`} />;
      case 'futsal':
        return <MaterialCommunityIcons name="soccer" size={24} color="#4F46E5" style={tw`mr-4`} />;
      case 'gym':
        return <MaterialCommunityIcons name="dumbbell" size={24} color="#4F46E5" style={tw`mr-4`} />;
      case 'basketball':
        return <MaterialCommunityIcons name="basketball" size={24} color="#4F46E5" style={tw`mr-4`} />;
      default:
        return <MaterialIcons name="sports" size={24} color="#4F46E5" style={tw`mr-4`} />;
    }
  };

  const renderEventItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('Chat', { eventId: item._id })} 
      style={tw`mb-4 p-4 bg-white rounded-lg shadow-md`}
    >
      <LinearGradient
        colors={['#e0eafc', '#cfdef3']}
        style={tw`rounded-lg p-4 flex-row items-center`}
      >
        {getCategoryIcon(item.category)}
        <View style={tw`flex-1`}>
          <Text style={tw`text-lg font-bold text-black mb-1`}>{item.name}</Text>
          {item.latestMessage ? (
            <Text style={tw`text-gray-600 text-sm`} numberOfLines={1}>
              {item.latestMessage.message}
            </Text>
          ) : (
            <Text style={tw`text-gray-600 text-sm`} numberOfLines={1}>
              No messages yet
            </Text>
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
        <Text style={tw`text-3xl font-bold text-white text-center`}>My Chat Groups</Text>
      </LinearGradient>

      <FlatList
        style={tw`flex-1 px-4 pt-4`}
        data={events}
        keyExtractor={(item) => item._id}
        renderItem={renderEventItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4F46E5']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default ListChatScreen;
