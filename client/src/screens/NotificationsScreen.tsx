import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../config/axiosInstance';
import tw from 'twrnc';

const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (user && user.token) {
      try {
        const response = await axiosInstance.get('/user/notifications', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setNotifications(response.data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  if (loading) {
    return <ActivityIndicator style={tw`flex-1`} size="large" color="rgb(234 88 12)" />;
  }

  return (
    <View style={tw`flex-1 bg-white p-4`}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.eventId}
        renderItem={({ item }) => (
          <View style={tw`mb-4 p-4 bg-gray-100 rounded-lg shadow-md`}>
            <Text style={tw`text-lg font-bold text-black`}>{item.message}</Text>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['rgb(234 88 12)']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default NotificationsScreen;
