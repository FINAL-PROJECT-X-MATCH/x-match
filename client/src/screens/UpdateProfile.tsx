import React, { useState, useEffect } from 'react';
import { View, Image, TextInput, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axiosInstance from '../config/axiosInstance';
import { useAuth } from '../context/AuthContext';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const UpdateProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/user', {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const userData = response.data;
      setUsername(userData.username);
      setEmail(userData.email);
      setImage(userData.avatar);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your photos!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUploading(true);
      setImage(result.assets[0].uri);
      setUploading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);

      if (image) {
        const uriParts = image.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('image', {
          uri: image,
          name: `profile.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      const response = await axiosInstance.patch('/user', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user?.token}`,
        },
      });

      console.log('Profile updated successfully:', response.data);
      Alert.alert('Success', 'Profile updated successfully!');
      setLoading(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'There was an error updating your profile.');
      setLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <LinearGradient
        colors={['rgb(249 115 22)', 'rgb(234 88 12)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.3 }}
        style={styles.gradient}
      />
      <ScrollView contentContainerStyle={tw`flex-1 justify-center items-center p-5`}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="rgb(249 115 22)" />
            <Text style={tw`mt-2 text-white`}>Updating...</Text>
          </View>
        )}
        <View style={tw`w-full bg-white p-5 rounded-3xl shadow-lg`}>
          <View style={tw`flex-row items-center mb-4`}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mr-2`}>
              <Ionicons name="arrow-back" size={24} color="rgb(249 115 22)" />
            </TouchableOpacity>
            <Text style={tw`text-3xl font-bold text-center flex-1 text-orange-500`}>Update Profile</Text>
          </View>
          <View style={tw`items-center mb-6`}>
            {image ? (
              <Image source={{ uri: image }} style={tw`w-32 h-32 rounded-full mb-4`} />
            ) : (
              <Ionicons name="person-circle-outline" size={120} color="gray" />
            )}
            <TouchableOpacity style={[tw`p-3 rounded-full mb-4 flex-row items-center`, { backgroundColor: 'rgb(249 115 22)' }]} onPress={pickImage}>
              <Ionicons name="image" size={24} color="white" style={tw`mr-2`} />
              <Text style={tw`text-white text-center text-lg`}>Pick an Image</Text>
            </TouchableOpacity>
            {uploading && (
              <View style={tw`mt-2`}>
                <ActivityIndicator size="small" color="rgb(249 115 22)" />
                <Text style={tw`mt-2 text-center`}>Uploading...</Text>
              </View>
            )}
          </View>
          <View style={tw`mb-4`}>
            <View style={[tw`flex-row items-center border p-3 rounded-xl mb-4`, { borderColor: 'rgb(249 115 22)' }]}>
              <Ionicons name="person" size={20} color="rgb(249 115 22)" style={tw`mr-2`} />
              <TextInput
                style={tw`flex-1 text-lg`}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
              />
            </View>
            <View style={[tw`flex-row items-center border p-3 rounded-xl`, { borderColor: 'rgb(249 115 22)' }]}>
              <Ionicons name="mail" size={20} color="rgb(249 115 22)" style={tw`mr-2`} />
              <TextInput
                style={tw`flex-1 text-lg`}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            </View>
          </View>
          <TouchableOpacity style={[tw`p-4 rounded-full mb-4 flex-row justify-center items-center`, { backgroundColor: 'rgb(249 115 22)' }]} onPress={updateProfile}>
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="save" size={24} color="white" style={tw`mr-2`} />
                <Text style={tw`text-white text-center text-lg`}>Update Profile</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[tw`p-4 rounded-full flex-row justify-center items-center`, { backgroundColor: 'rgb(251 191 36)' }]} onPress={logout}>
            <Ionicons name="log-out" size={24} color="white" style={tw`mr-2`} />
            <Text style={tw`text-white text-center text-lg`}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    width: '100%',
    height: '30%',
    position: 'absolute',
    top: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

export default UpdateProfile;
