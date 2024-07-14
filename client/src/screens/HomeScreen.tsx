import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, FlatList, Dimensions, Animated, ScrollView } from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import axiosInstance from '../config/axiosInstance';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const translateX = useState(new Animated.Value(0))[0];
  const windowWidth = Dimensions.get("window").width;
  const { user } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
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
    };

    fetchEvents();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length;
        Animated.spring(translateX, {
          toValue: -nextIndex * windowWidth,
          useNativeDriver: true,
        }).start();
        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const banners = [
    "https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    "https://images.pexels.com/photos/248547/pexels-photo-248547.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    "https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
  ];

  const renderBanner = ({ item, index }: { item: string, index: number }) => (
    <Image key={index} source={{ uri: item }} style={[styles.banner, { width: windowWidth }]} />
  );

  const renderEventItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => navigation.navigate('EventDetail', { eventId: item._id })}>
      <View style={styles.card}>
        <Image source={{ uri: item.imageLocation }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <Text style={styles.eventName}>{item.name}</Text>
          <Text style={styles.eventCategory}>{item.category}</Text>
          <Text style={styles.eventDate}>{item.date}</Text>
          <View style={styles.participantInfo}>
            <FontAwesome name="users" size={14} color="gray" />
            <Text style={styles.eventParticipants}>{`Participants: ${item.player.length}/${item.quota}`}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHorizontalEventList = (title: string, data: any[]) => (
    <View style={styles.horizontalListContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => item._id}
        renderItem={renderEventItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalListContent}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          {/* <Text style={styles.userName}>{user.username}</Text> */}
        </View>
        {/* <Image source={{ uri: user.avatar }} style={styles.avatar} /> */}
      </View>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="gray" />
        <TextInput
          placeholder="Search events..."
          style={styles.searchInput}
        />
      </View>
      <View style={styles.bannerContainer}>
        <Animated.View style={[styles.bannerWrapper, { transform: [{ translateX }] }]}>
          {banners.map((banner, index) => renderBanner({ item: banner, index }))}
        </Animated.View>
      </View>
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          data={['Sepakbola', 'Futsal', 'Gym', 'Basket']}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.categoryButton}>
              <Text style={styles.categoryText}>{item}</Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryListContent}
        />
      </View>
      {renderHorizontalEventList('Popular Events', events.slice(0, 3))}
      {renderHorizontalEventList('Nearby Events', events.slice(3, 6))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userName: {
    fontSize: 16,
    color: 'gray',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryListContent: {
    alignItems: 'center',
  },
  categoryButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  horizontalListContainer: {
    marginBottom: 20,
  },
  horizontalListContent: {
    paddingLeft: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    width: screenWidth - 80, 
    height: 200, 
  },
  cardImage: {
    width: '100%',
    height: 100, 
  },
  cardContent: {
    padding: 10,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  eventCategory: {
    fontSize: 12,
    color: '#555',
    marginBottom: 5,
  },
  eventDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventParticipants: {
    marginLeft: 5,
    fontSize: 12,
    color: '#888',
  },
  bannerContainer: {
    overflow: "hidden",
    height: 100,
    marginBottom: 20,
  },
  bannerWrapper: {
    flexDirection: "row",
  },
  banner: {
    height: 100,
    borderRadius: 8,
    marginBottom: 20,
  },
});

export default HomeScreen;
