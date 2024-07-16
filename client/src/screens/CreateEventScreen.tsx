import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Image, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker, MapPressEvent, PROVIDER_DEFAULT } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useAuth } from '../context/AuthContext';
import Modal from 'react-native-modal';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import axiosInstance from '../config/axiosInstance';
import Toast from 'react-native-toast-message';
import tw from 'twrnc';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface CreateEventScreenProps {
  navigation: any;
}

const CreateEventScreen: React.FC<CreateEventScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState(new Date());
  const [quota, setQuota] = useState(0);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState({ latitude: -7.2575, longitude: 112.7521 });
  const [modalVisible, setModalVisible] = useState(false);
  const [locationPicked, setLocationPicked] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [region, setRegion] = useState({
    latitude: -7.2575,
    longitude: 112.7521,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [loading, setLoading] = useState(false);
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('');

  const { user } = useAuth();
  const ref = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'Permission to access location was denied'
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const { uri } = result.assets[0];
      setImage(uri);
    }
  };

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({ latitude, longitude });
    setRegion({ ...region, latitude, longitude });
    setLocationPicked(true);

    fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyCOi8-TXQCmG5SztxcWJCGClqGlaNZ53Eo`)
      .then(response => response.json())
      .then(data => {
        if (data.results.length > 0) {
          setAddress(data.results[0].formatted_address);
        }
      })
      .catch(error => console.error('Error fetching address:', error));
  };

  const createEvent = async () => {
    if (user?.token) {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('category', category);
      formData.append('address', address);
      formData.append('date', date.toISOString());
      formData.append('quota', quota.toString());
      formData.append('description', description);
      formData.append('location', JSON.stringify(location));
      if (image) {
        formData.append('imageLocation', {
          uri: image,
          name: 'event.jpg',
          type: 'image/jpeg',
        } as any);
      }
      formData.append('price', isFree ? 'free' : (Number(price) + 1000).toString());

      try {
        const response = await axiosInstance.post('/event', formData, {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        const createdEvent = response.data;
        Toast.show({
          type: 'success',
          text1: 'Event Created',
          text2: 'Your event has been created successfully.'
        });
        navigation.navigate('EventDetail', { eventId: createdEvent._id }); // Navigate to EventDetail page
        
        // Reset form state
        setName('');
        setCategory('');
        setAddress('');
        setDate(new Date());
        setQuota(0);
        setDescription('');
        setImage(null);
        setLocation({ latitude: -7.2575, longitude: 112.7521 });
        setLocationPicked(false);
        setRegion({
          latitude: -7.2575,
          longitude: 112.7521,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        setIsFree(true);
        setPrice('');
      } catch (error: any) {
        console.error('Error creating event:', error.response ? error.response.data : error.message);
        Toast.show({
          type: 'error',
          text1: 'Error Creating Event',
          text2: error.response ? error.response.data.message : error.message
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={tw`flex-1`}
    >
      <LinearGradient
        colors={['rgb(234, 88, 12)', 'rgb(249, 115, 22)']}
        style={tw`absolute top-0 left-0 right-0 h-64 rounded-b-3xl`}
      />
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-6 pt-16`}>
        <Text style={tw`text-4xl font-bold mb-8 text-center text-white`}>Create Event</Text>
        
        <View style={tw`bg-white rounded-3xl shadow-lg p-6 mb-6`}>
          <View style={tw`mb-6`}>
            <Text style={tw`text-lg font-semibold mb-2 text-gray-700`}>Event Name</Text>
            <View style={tw`flex-row items-center bg-gray-100 rounded-xl p-2`}>
              <MaterialCommunityIcons name="calendar-text" size={24} color="rgb(249 115 22)" style={tw`mr-2`} />
              <TextInput
                placeholder="Enter event name"
                value={name}
                onChangeText={setName}
                style={tw`flex-1 text-gray-800 text-lg`}
              />
            </View>
          </View>
          
          <View style={tw`mb-6`}>
            <Text style={tw`text-lg font-semibold mb-2 text-gray-700`}>Description</Text>
            <View style={tw`bg-gray-100 rounded-xl p-2`}>
              <TextInput
                placeholder="Describe your event"
                value={description}
                onChangeText={setDescription}
                style={tw`text-gray-800 text-lg h-32`}
                multiline
              />
            </View>
          </View>

          <View style={tw`mb-6`}>
            <Text style={tw`text-lg font-semibold mb-2 text-gray-700`}>Category</Text>
            <View style={tw`bg-gray-100 rounded-xl`}>
              <RNPickerSelect
                onValueChange={(value) => setCategory(value)}
                items={[
                  { label: 'Football', value: 'Football' },
                  { label: 'Futsal', value: 'Futsal' },
                  { label: 'Gym', value: 'Gym' },
                  { label: 'Basketball', value: 'Basketball' },
                ]}
                style={{
                  inputIOS: tw`p-4 text-gray-800 text-lg`,
                  inputAndroid: tw`p-4 text-gray-800 text-lg`,
                }}
                placeholder={{ label: 'Select a category', value: null }}
                Icon={() => <MaterialCommunityIcons name="chevron-down" size={24} color="rgb(249 115 22)" />}
              />
            </View>
          </View>
          
          <View style={tw`mb-6`}>
            <Text style={tw`text-lg font-semibold mb-2 text-gray-700`}>Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={tw`bg-gray-100 p-4 rounded-xl flex-row items-center justify-between`}
            >
              <Text style={tw`text-gray-800 text-lg`}>{moment(date).format('MMMM D, YYYY')}</Text>
              <MaterialCommunityIcons name="calendar" size={24} color="rgb(249 115 22)" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>
          
          <View style={tw`mb-6`}>
            <Text style={tw`text-lg font-semibold mb-2 text-gray-700`}>Quota</Text>
            <View style={tw`flex-row items-center bg-gray-100 rounded-xl`}>
              <TouchableOpacity onPress={() => setQuota(Math.max(0, quota - 1))} style={tw`p-4`}>
                <MaterialCommunityIcons name="minus-circle" size={24} color="rgb(249 115 22)" />
              </TouchableOpacity>
              <TextInput
                value={quota.toString()}
                onChangeText={(text) => setQuota(parseInt(text) || 0)}
                keyboardType="numeric"
                style={tw`flex-1 text-center text-lg text-gray-800`}
              />
              <TouchableOpacity onPress={() => setQuota(quota + 1)} style={tw`p-4`}>
                <MaterialCommunityIcons name="plus-circle" size={24} color="rgb(249 115 22)" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={tw`mb-6`}>
            <Text style={tw`text-lg font-semibold mb-2 text-gray-700`}>Paid Event</Text>
            <View style={tw`flex-row items-center`}>
              <Switch
                value={!isFree}
                onValueChange={() => setIsFree(!isFree)}
                trackColor={{ false: 'gray', true: 'rgb(249 115 22)' }}
                thumbColor="white"
              />
              <Text style={tw`ml-2 text-gray-700`}>{isFree ? 'Free' : 'Paid'}</Text>
            </View>
          </View>

          {!isFree && (
            <View style={tw`mb-6`}>
              <Text style={tw`text-lg font-semibold mb-2 text-gray-700`}>Price (Rp)</Text>
              <View style={tw`flex-row items-center bg-gray-100 rounded-xl p-2`}>
                <TextInput
                  placeholder="Enter price"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  style={tw`flex-1 text-gray-800 text-lg`}
                />
              </View>
              {price && (
                <Text style={tw`mt-2 text-gray-600 italic`}>
                  The event price will be shown as Rp {Number(price) + 1000}
                </Text>
              )}
            </View>
          )}
          
          <View style={tw`mb-6`}>
            <Text style={tw`text-lg font-semibold mb-2 text-gray-700`}>Location</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={tw`bg-orange-500 p-4 rounded-xl flex-row items-center justify-center`}
            >
              <MaterialCommunityIcons name="map-marker" size={24} color="white" style={tw`mr-2`} />
              <Text style={tw`text-white text-center font-semibold text-lg`}>Select Location</Text>
            </TouchableOpacity>
            {address && (
              <Text style={tw`mt-2 text-gray-600 italic`}>{address}</Text>
            )}
          </View>
          
          <View style={tw`mb-6`}>
            <Text style={tw`text-lg font-semibold mb-2 text-gray-700`}>Event Image</Text>
            <TouchableOpacity
              onPress={pickImage}
              style={tw`bg-orange-500 p-4 rounded-xl flex-row items-center justify-center`}
            >
              <MaterialCommunityIcons name="camera" size={24} color="white" style={tw`mr-2`} />
              <Text style={tw`text-white text-center font-semibold text-lg`}>Choose Image</Text>
            </TouchableOpacity>
            {image && (
              <Image source={{ uri: image }} style={tw`w-full h-48 mt-4 rounded-xl`} />
            )}
          </View>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color="rgb(249 115 22)" />
        ) : (
          <TouchableOpacity
            onPress={createEvent}
            style={tw`bg-orange-500 p-4 rounded-xl mt-4`}
          >
            <Text style={tw`text-white text-center font-bold text-lg`}>Create Event</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={tw`m-0 justify-end`}
      >
        <View style={tw`bg-white rounded-t-3xl p-6 h-4/5`}>
          <Text style={tw`text-2xl font-bold mb-4 text-center text-orange-500`}>Select Location</Text>
          <GooglePlacesAutocomplete
            ref={ref}
            placeholder="Search for location"
            onPress={(data, details = null) => {
              if (details) {
                const newLocation = {
                  latitude: details.geometry.location.lat,
                  longitude: details.geometry.location.lng,
                };
                setAddress(data.description);
                setLocation(newLocation);
                setRegion({
                  ...newLocation,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                });
                setLocationPicked(true);
                setModalVisible(false);
              }
            }}
            query={{
              key: 'AIzaSyCOi8-TXQCmG5SztxcWJCGClqGlaNZ53Eo',
              language: 'id',
            }}
            fetchDetails={true}
            styles={{
              textInputContainer: tw`bg-gray-100 border-0 rounded-xl mb-4`,
              textInput: tw`bg-gray-100 rounded-xl`,
              listView: tw`bg-white`,
            }}
            debounce={200}
            enablePoweredByContainer={false}
          />
          <MapView
            provider={PROVIDER_DEFAULT}
            style={tw`w-full h-64 rounded-xl`}
            region={region}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {locationPicked && <Marker coordinate={location} />}
          </MapView>
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={tw`bg-orange-500 p-4 rounded-xl mt-4`}
          >
            <Text style={tw`text-white text-center font-semibold text-lg`}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default CreateEventScreen;
