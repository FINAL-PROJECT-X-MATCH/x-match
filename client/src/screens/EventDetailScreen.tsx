import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, ActivityIndicator, ScrollView, TouchableOpacity, 
  Image, Alert, Animated, Dimensions, Easing
} from 'react-native';
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
import { WebView } from 'react-native-webview';

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
  price: number | 'free';
}

const { width, height } = Dimensions.get('window');

const EventDetailScreen: React.FC<EventDetailScreenProps> = ({ route, navigation }) => {
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const { user } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    moment.locale('id');
    fetchEventDetail();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, [eventId, user?.token]);

  const fetchEventDetail = async () => {
    if (user?.token) {
      try {
        const response = await axiosInstance.get<Event>(`/event/${eventId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setEvent(response.data);
        setIsJoined(response.data.player.includes(user.id))
      } catch (error) {
        console.error(error);
      }
    }
  };

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const handlePayment = async () => {
    try {
      const response = await axiosInstance.post('/midtrans/transaction', {
        eventId: eventId,
        amount: event?.price,
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });

      const { token } = response.data;
      setPaymentUrl(`https://app.sandbox.midtrans.com/snap/v2/vtweb/${token}`);
    } catch (error) {
      console.error('Payment Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Payment Error',
        text2: 'Failed to initiate payment.',
      });
    }
  };

  const joinEvent = async () => {
    if (user?.token) {
      try {
        const response = await axiosInstance.post(`/event/${eventId}/join`, {}, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'You have successfully joined the event.',
        });
        setIsJoined(true);
        setEvent(response.data);
        
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

  const handleJoinEvent = () => {
    if (event?.price === 'free') {
      joinEvent();
    } else {
      Alert.alert(
        'Payment Required',
        `This event requires payment of ${formatIDR(event?.price as number)}. Do you want to proceed to payment?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed', onPress: handlePayment },
        ]
      );
    }
  };

  const openLocationInMaps = () => {
    if (event?.location) {
      openMap({ latitude: event.location.latitude, longitude: event.location.longitude });
    }
  };

  if (!event) return <ActivityIndicator style={tw`flex-1`} size="large" color="rgb(249 115 22)" />;

  if (paymentUrl) {
    return (
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={(navState) => {
          if (navState.url.includes('transaction_status=settlement')) {
            setPaymentUrl(null);
            joinEvent();
          }
        }}
      />
    );
  }

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [height * 0.5, height * 0.2],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={tw`flex-1 bg-gray-100`}>
      <Animated.View style={[tw`w-full overflow-hidden`, { height: headerHeight }]}>
        <SharedElement id={`event.${eventId}.image`}>
          <Image source={{ uri: event.imageLocation }} style={tw`w-full h-full`} />
        </SharedElement>
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          style={tw`absolute inset-0`}
        />
        <Animated.View style={[tw`absolute top-12 left-0 right-0 items-center`, { opacity: headerTitleOpacity }]}>
          <Text style={tw`text-2xl font-bold text-white text-center px-4`}>{event.name}</Text>
        </Animated.View>
        <Animated.View style={[tw`absolute bottom-8 left-5 right-5`, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <BlurView intensity={80} tint="dark" style={tw`rounded-3xl overflow-hidden`}>
            <View style={tw`p-4`}>
              <Text style={tw`text-3xl font-bold text-white mb-2`}>{event.name}</Text>
              <Text style={tw`text-lg text-white`}>{moment(event.date).format('dddd, DD MMMM YYYY')}</Text>
            </View>
          </BlurView>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={tw`pt-5 pb-20`}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <BlurView intensity={80} tint="light" style={tw`mx-5 p-5 rounded-3xl overflow-hidden shadow-lg`}>
            <View style={tw`flex-row items-center mb-3`}>
              <Ionicons name="location" size={24} color="rgb(249 115 22)" />
              <Text style={tw`ml-2 text-base text-gray-700`}>{event.address}</Text>
            </View>
            <TouchableOpacity onPress={openLocationInMaps} style={tw`bg-orange-500 p-3 rounded-xl items-center`}>
              <Text style={tw`text-white font-bold`}>Open in Maps</Text>
            </TouchableOpacity>
          </BlurView>

          <View style={tw`h-52 mx-5 my-5 rounded-3xl overflow-hidden shadow-lg`}>
            <MapView
              style={tw`flex-1`}
              initialRegion={{
                latitude: event.location.latitude,
                longitude: event.location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              zoomEnabled={false}
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

          <BlurView intensity={80} tint="light" style={tw`mx-5 p-5 rounded-3xl overflow-hidden shadow-lg`}>
            <View style={tw`flex-row items-center mb-3`}>
              <Ionicons name="person-circle" size={24} color="rgb(249 115 22)" />
              <Text style={tw`ml-2 text-base text-gray-700`}>Posted by {event.authorUsername}</Text>
            </View>
          </BlurView>

          <BlurView intensity={80} tint="light" style={tw`mx-5 p-5 rounded-3xl overflow-hidden shadow-lg`}>
            <Text style={tw`text-2xl font-bold text-gray-800 mb-3`}>About the Event</Text>
            <View style={tw`flex-row items-center mb-3`}>
              <Ionicons name="pricetag" size={20} color="rgb(249 115 22)" />
              <Text style={tw`ml-2 text-base text-orange-500`}>{event.category}</Text>
            </View>
            <Text style={tw`text-base text-gray-700 leading-6`}>{event.description}</Text>
          </BlurView>

          <Animated.View style={[tw`mx-5 my-5`, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <BlurView intensity={80} tint="light" style={tw`p-4 rounded-3xl shadow-lg`}>
              <Text style={tw`text-xl font-bold text-center text-gray-800 mb-2`}>
                {`Participants: ${event.player.length}/${event.quota}`}
              </Text>
              <View style={tw`w-full bg-gray-200 rounded-full h-2.5`}>
                <View 
                  style={[
                    tw`bg-orange-500 h-2.5 rounded-full`, 
                    { width: `${(event.player.length / event.quota) * 100}%` }
                  ]} 
                />
              </View>
            </BlurView>
          </Animated.View>

          {!isJoined && (
            <TouchableOpacity onPress={handleJoinEvent} style={tw`mx-5 mt-5`}>
              <LinearGradient
                colors={['rgb(249 115 22)', 'rgb(234 88 12)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={tw`py-4 px-6 rounded-full shadow-lg`}
              >
                <Text style={tw`text-center text-lg font-bold text-white`}>
                  {event.price === 'free' ? 'Join Event' : `Pay ${formatIDR(event.price as number)} and Join`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.ScrollView>

      <TouchableOpacity
        style={tw`absolute top-10 left-5 bg-black bg-opacity-50 rounded-full p-2`}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {isJoined && (
        <TouchableOpacity
          style={tw`absolute bottom-8 right-8 w-15 h-15 rounded-full bg-orange-500 justify-center items-center shadow-lg`}
          onPress={() => navigation.navigate('Chat', { eventId })}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EventDetailScreen;
