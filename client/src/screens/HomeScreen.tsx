import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image, FlatList, Dimensions, Animated, ScrollView, ActivityIndicator, RefreshControl, Modal
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MaterialIcons, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axiosInstance from '../config/axiosInstance';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const { width: screenWidth } = Dimensions.get('window');
const bannerWidth = screenWidth * 0.9;
const bannerHeight = bannerWidth * 0.5;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<FlatList>(null);
  const { user, getNotifications, unableToJoin, notificationOK } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
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
    Animated.loop(
      Animated.timing(scrollX, {
        toValue: bannerWidth + 10,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchNotifications = async () => {
        const notifications = await getNotifications();
        setNotifications(Array.isArray(notifications) ? notifications : []);
        setUnreadCount(notifications.filter((notification: any) => !notification.read).length);
      };

      fetchNotifications();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    if (user && user.token) {
      try {
        const response = await axiosInstance.get('/events', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setEvents(response.data);
      } catch (error) {
        console.error(error);
      }
    }
    setRefreshing(false);
  };

  const fetchNotifications = async () => {
    if (user && user.token) {
      try {
        const response = await axiosInstance.get('/user/notifications', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const notifications = Array.isArray(response.data) ? response.data : [];
        setNotifications(notifications);
        setUnreadCount(notifications.filter((notification: any) => !notification.read).length);
        setModalVisible(true);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    }
  };

  const markNotificationsAsRead = () => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
    setUnreadCount(0);
  };

  const handleUnableToJoin = async (eventId: string) => {
    try {
      await unableToJoin(eventId);
      onRefresh();
    } catch (error) {
      console.error('Error leaving event:', error);
    }
  };

  const handleNotificationResponse = async (notification: any, response: 'yes' | 'no') => {
    if (response === 'no') {
      await handleUnableToJoin(notification.eventId);
    } else if (response === 'yes') {
      await notificationOK(notification.eventId);
    }

    
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notif) => notif.eventId !== notification.eventId)
    );
    setUnreadCount((prevCount) => prevCount - 1);

    setModalVisible(false);
  };

  const banners = [
    "https://cdn.discordapp.com/attachments/1259788639018287208/1263677643862052946/Spanduk_Pertandingan_Bulutangkis_Simpel_Hijau_Kuning_20240719_090325_0000.png?ex=669b1b04&is=6699c984&hm=7ef092fc8ed29f879d121425305904103391459061ba6f40588121d507ccef05&",
    "https://cdn.discordapp.com/attachments/1259788639018287208/1263681487241347248/Untitled_design-2.png?ex=669b1e98&is=6699cd18&hm=7041201f48d15729d7a14767613a266a265b9d4a449636221d8afa6a0dd9ad86&",
    "https://cdn.discordapp.com/attachments/1259788639018287208/1263681060093431898/Merah_dan_Kuning_Ilustrasi_Olahraga_Youtube_Thumbnail_20240719_091702_0000.png?ex=669b1e32&is=6699ccb2&hm=232c5eb1cc5de7eb1cb76a3cc20c3303d61567bea8340f6fe01d039aefc01abf&"
  ];

  const renderBanner = ({ item, index }: { item: string, index: number }) => (
    <Image
      key={index}
      source={{ uri: item }}
      style={[tw`h-48 rounded-3xl`, { width: bannerWidth, height: bannerHeight }]}
    />
  );

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
    const R = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon1 - lon2);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(price);
  };

  const popularEvents = events.sort((a, b) => b.player.length - a.player.length).slice(0, 3);

  const nearbyEvents = events.filter(event => {
    if (!location) return false;
    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      event.location.latitude,
      event.location.longitude
    );
    return distance < 3;
  });

  const renderEventItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('EventDetail', { eventId: item._id })}
      style={tw`mr-4 w-72`} // Adjusted width of the event card
    >
      <View style={tw`bg-white rounded-3xl overflow-hidden shadow-lg`}>
        <Image source={{ uri: item.imageLocation }} style={tw`w-full h-36`} />

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
              <Ionicons name="calendar-outline" size={14} color="#f97316" />
              <Text style={tw`ml-1 text-xs text-gray-500`}>{formatDate(item.date)}</Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <FontAwesome name="users" size={14} color="#f97316" />
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
            <Ionicons name="pricetag-outline" size={14} color="#f97316" />
            <Text style={tw`ml-1 text-xs text-gray-500`}>{item.price === 'free' ? 'Free' : formatPrice(item.price)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHorizontalEventList = (title: string, data: any[]) => (
    <View style={tw`mb-8`}>
      <Text style={tw`text-2xl font-bold mb-4 ml-4 text-black`}>{title}</Text>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => item._id}
        renderItem={renderEventItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`pl-4`}
      />
    </View>
  );

  if (loading) {
    return <ActivityIndicator style={tw`flex-1`} size="large" color="#f97316" />;
  }

  return (
    <ScrollView
      style={tw`flex-1 bg-gray-50`}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#f97316']}
        />
      }
    >
      <LinearGradient
        colors={['background-color: rgb(234 88 12);', 'background-color:rgb(249 115 22)']}
        style={tw`pt-12 pb-6 px-4 rounded-b-3xl`}
      >
        <View style={tw`flex-row items-center justify-between mb-6`}>
          <View>
            <Text style={tw`text-3xl font-bold text-white`}>Welcome back!</Text>
            <Text style={tw`text-xl text-white`}>{user?.username}</Text>
          </View>
          <TouchableOpacity style={tw`relative bg-white p-3 rounded-full shadow-md`} onPress={() => { fetchNotifications(); setModalVisible(true); }}>
            <Ionicons name="notifications" size={24} color="rgb(249 115 22)" />
            {unreadCount > 0 && (
              <View style={tw`absolute -top-1 -right-1 bg-red-600 h-5 w-5 rounded-full justify-center items-center`}>
                <Text style={tw`text-white text-xs font-bold`}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={tw`mt-6 mb-8`}>
        <Animated.FlatList
          data={banners}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          pagingEnabled
          ref={scrollViewRef}
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          renderItem={renderBanner}
          contentContainerStyle={tw`px-4`}
          snapToInterval={bannerWidth + 10}
          decelerationRate="fast"
          ItemSeparatorComponent={() => <View style={tw`w-2`} />}
        />
        <View style={tw`flex-row justify-center mt-4`}>
          {banners.map((_, i) => {
            const inputRange = [(i - 1) * (bannerWidth + 10), i * (bannerWidth + 10), (i + 1) * (bannerWidth + 10)];
            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.8, 1.2, 0.8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i.toString()}
                style={[
                  tw`h-2 w-2 rounded-full mx-1 bg-[#f97316]`,
                  { opacity, transform: [{ scale }] },
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={tw`mb-8`}>
        <FlatList
          horizontal
          data={['Football', 'Futsal', 'Gym', 'Basketball']}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('ListEvent', { category: item })}
              style={tw`mr-3 bg-white px-6 py-3 rounded-full shadow-md border-2 border-[#f97316] flex-row items-center`}
            >
              {getCategoryIcon(item)}
              <Text style={tw`text-[#f97316] font-bold text-base ml-2`}>{item}</Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`px-4`}
        />
      </View>

      {renderHorizontalEventList('Popular Events', popularEvents)}
      {renderHorizontalEventList('Nearby Events', nearbyEvents)}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
          markNotificationsAsRead();
        }}
      >
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`bg-white p-6 rounded-3xl shadow-lg w-11/12 max-h-3/4`}>
            <Text style={tw`text-2xl font-bold mb-4 text-black`}>Notifications</Text>
            <FlatList
              data={notifications}
              keyExtractor={(item) => (item._id && item._id.toString()) || Math.random().toString()}
              renderItem={({ item }) => (
                <View style={tw`mb-4 p-4 bg-gray-100 rounded-lg shadow-md`}>
                  <Text style={tw`text-lg font-bold text-black`}>{item.message || 'No message'}</Text>
                  <View style={tw`flex-row justify-between mt-4`}>
              <TouchableOpacity
    style={tw`bg-green-500 py-2 px-4 rounded-full flex-1 mr-2`}
    onPress={() => handleNotificationResponse(item, 'yes')}
  >
    <Text style={tw`text-white text-center text-sm font-bold`}>Yes</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={tw`bg-red-500 py-2 px-4 rounded-full flex-1 ml-2`}
    onPress={() => handleNotificationResponse(item, 'no')}
  >
    <Text style={tw`text-white text-center text-sm font-bold`}>No</Text>
  </TouchableOpacity>
</View>
                </View>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={tw`pb-4`}
            />
            <TouchableOpacity
              style={tw`mt-4 bg-orange-600 py-3 px-6 rounded-full`}
              onPress={() => {
                setModalVisible(!modalVisible);
                markNotificationsAsRead();
              }}
            >
              <Text style={tw`text-white text-center text-lg font-bold`}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default HomeScreen;
