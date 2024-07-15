import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../config/axiosInstance';
import openMap from 'react-native-open-maps';
import moment from 'moment';
import 'moment/locale/id';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SharedElement } from 'react-navigation-shared-element';
import { StackScreenProps } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';

type RootStackParamList = {
  EventDetail: { eventId: string };
  Chat: { eventId: string };
};

type EventDetailScreenProps = StackScreenProps<RootStackParamList, 'EventDetail'>;

interface Event {
  id: string;
  name: string;
  imageLocation: string;
  authorUsername: string;
  date: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  category: string;
  description: string;
  player: string[];
  quota: number;
}

const EventDetailScreen: React.FC<EventDetailScreenProps> = ({ route, navigation }) => {
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    moment.locale('id');
    fetchEventDetail();
  }, [eventId, user?.token]);

  const fetchEventDetail = async () => {
    if (user?.token) {
      try {
        const response = await axiosInstance.get<Event>(`/event/${eventId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setEvent(response.data);
        setIsJoined(response.data.player.includes(user.id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  const joinEvent = async () => {
    if (user?.token) {
      try {
        await axiosInstance.post(`/event/${eventId}/join`, {}, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'You have successfully joined the event.',
        });
        setIsJoined(true);
      } catch (error) {
        console.error(error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to join the event.',
        });
      }
    }
  };

  const openLocationInMaps = () => {
    if (event?.location) {
      openMap({ latitude: event.location.latitude, longitude: event.location.longitude });
    }
  };

  if (!event) return <ActivityIndicator style={tw`flex-1`} size="large" color="#4F46E5" />;

  return (
    <View style={tw`flex-1`}>
      <View style={tw`absolute top-10 left-5 z-10`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`bg-white p-2 rounded-full shadow`}>
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={tw`pb-10`}>
        <SharedElement id={`event.${eventId}.image`}>
          <Image source={{ uri: event.imageLocation }} style={tw`w-full h-80`} />
        </SharedElement>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
          style={tw`absolute left-0 right-0 top-60 h-20`}
        />
        <View style={tw`px-6 -mt-10`}>
          <BlurView intensity={80} tint="light" style={tw`rounded-3xl overflow-hidden mb-6`}>
            <View style={tw`p-6`}>
              <Text style={tw`text-3xl font-bold text-gray-800 mb-2`}>{event.name}</Text>
              <View style={tw`flex-row items-center mb-4`}>
                <Ionicons name="person-circle" size={24} color="#4F46E5" />
                <Text style={tw`text-base text-gray-600 ml-2`}>Posted by {event.authorUsername}</Text>
              </View>
              <View style={tw`flex-row items-center mb-4 bg-gray-100 p-4 rounded-xl`}>
                <Ionicons name="calendar" size={20} color="#4F46E5" />
                <Text style={tw`text-base text-gray-700 ml-3`}>{moment(event.date).format('dddd, DD MMMM YYYY')}</Text>
              </View>
              <View style={tw`flex-row items-center mb-4 bg-gray-100 p-4 rounded-xl`}>
                <Ionicons name="location" size={20} color="#4F46E5" />
                <Text style={tw`text-base text-gray-700 ml-3 underline`}>{event.address}</Text>
              </View>
              <TouchableOpacity onPress={openLocationInMaps} style={tw`flex-col items-center mb-4 bg-gray-100 p-4 rounded-xl`}>
                <LinearGradient
                  colors={['#4F46E5', '#5753E8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={tw`py-2 px-4 rounded-full shadow-lg`}
                >
                  <Text style={tw`text-white font-bold text-lg text-center`}>Open Map</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>

          <View style={tw`h-56 rounded-3xl overflow-hidden my-6 shadow-lg`}>
            <MapView
              style={tw`flex-1`}
              initialRegion={{
                latitude: event.location.latitude,
                longitude: event.location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={true}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: event.location.latitude,
                  longitude: event.location.longitude,
                }}
                title={event.name}
                description={event.address}
              />
            </MapView>
          </View>

          <BlurView intensity={80} tint="light" style={tw`rounded-3xl overflow-hidden mb-6`}>
            <View style={tw`p-6`}>
              <View style={tw`flex-row items-center mb-4`}>
                <Ionicons name="pricetag" size={20} color="#4F46E5" />
                <Text style={tw`text-base text-gray-700 ml-3`}>{event.category}</Text>
              </View>
              <Text style={tw`text-base text-gray-700`}>{event.description}</Text>
            </View>
          </BlurView>

          {isJoined && (
            <View style={styles.joinedMessageContainer}>
              <Ionicons name="checkmark-circle" size={32} color="#4F46E5" />
              <Text style={styles.joinedMessageText}>You have joined this event</Text>
            </View>
          )}

          <Text style={tw`text-xl font-bold text-center text-gray-800 mb-6`}>
            {`Participant: ${event.player.length}/${event.quota}`}
          </Text>

          {!isJoined && (
            <TouchableOpacity onPress={joinEvent}>
              <LinearGradient
                colors={['#4F46E5', '#5753E8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={tw`py-4 px-8 rounded-full shadow-lg`}
              >
                <Text style={tw`text-white font-bold text-lg text-center`}>Join Event</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {isJoined && (
        <TouchableOpacity
          style={[styles.chatBubble, tw`bg-indigo-600`]}
          onPress={() => navigation.navigate('Chat', { eventId })}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chatBubble: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  joinedMessageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#E0E7FF',
    borderRadius: 20,
  },
  joinedMessageText: {
    textAlign: 'center',
    color: '#4F46E5',
    fontSize: 16,
    marginTop: 5,
  },
});

export default EventDetailScreen;
