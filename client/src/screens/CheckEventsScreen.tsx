import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import axiosInstance from '../config/axiosInstance';
import { useAuth } from '../context/AuthContext';
import tw from 'twrnc';
import Toast from 'react-native-toast-message';

const CheckEventsScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const checkEvents = async () => {
    if (user && user.token) {
      try {
        const response = await axiosInstance.get('/events/check', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (response.status === 200) {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Event notifications sent successfully',
          });
        }
      } catch (error) {
        console.error(error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to check events',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    checkEvents();
  }, []);

  if (loading) {
    return <ActivityIndicator style={tw`flex-1`} size="large" color="#4F46E5" />;
  }

  return (
    <View style={tw`flex-1 justify-center items-center`}>
      <Text style={tw`text-xl font-bold`}>Checking Events...</Text>
    </View>
  );
};

export default CheckEventsScreen;
