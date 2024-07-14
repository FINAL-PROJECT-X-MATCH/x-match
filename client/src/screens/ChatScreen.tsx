import React, { useState, useEffect } from 'react';
import {
  View, TextInput, FlatList, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Modal, TouchableWithoutFeedback, ActivityIndicator
} from 'react-native';
import { useTheme, Provider as PaperProvider, Appbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../config/axiosInstance';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import tw from 'twrnc';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const socketUrl = 'https://18bf-36-68-222-140.ngrok-free.app';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

interface ChatScreenProps {
  route: ChatScreenRouteProp;
  navigation: ChatScreenNavigationProp;
}

interface Message {
  _id: string;
  message: string;
  username: string;
  image?: string;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { eventId } = route.params;
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!user) {
      console.error('User is not defined');
      return;
    }

    const newSocket = io(socketUrl, {
      query: { token: user.token },
    });

    setSocket(newSocket);

    newSocket.on('message', (newMessage: Message) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    newSocket.emit('join', { eventId, userId: user.id });

    return () => {
      newSocket.off('message');
      newSocket.emit('leave', { eventId, userId: user.id });
      newSocket.close();
    };
  }, [eventId, user]);

  const fetchMessages = async () => {
    try {
      const response = await axiosInstance.get(`/chats/${eventId}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [eventId]);

  const sendMessage = async () => {
    if (!socket || !user || isUploading) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('eventId', eventId);
    formData.append('message', message);
    if (imageUri) {
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      formData.append('image', { uri: imageUri, name: filename, type } as any);
    }

    try {
      const response = await axiosInstance.post('/chats', formData, {
        headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' },
      });
      const newMessage = response.data;
      socket.emit('sendMessage', newMessage);
      setMessage('');
      setImageUri(null);
    } catch (error: any) {
      console.error('Error sending message:', error.response ? error.response.data : error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return cameraStatus === 'granted' && mediaLibraryStatus === 'granted';
  };

  const selectImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      alert('Camera and media library permissions are required to select an image.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      const imageUri = result.assets[0].uri;
      setImageUri(imageUri); // Set the image URI to preview the image
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      alert('Camera and media library permissions are required to take a photo.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      const imageUri = result.assets[0].uri;
      setImageUri(imageUri);
    }
  };

  const handleImagePress = (uri: string) => {
    setSelectedImage(uri);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View
      style={[
        tw`mb-2 flex-row items-end`,
        item.username === user.username ? tw`justify-end` : tw`justify-start`,
      ]}
    >
      <View
        style={[
          tw`max-w-[80%] p-2 rounded-xl shadow-md`,
          item.username === user.username ? tw`bg-[#4F46E5]` : tw`bg-white`,
        ]}
      >
        <Text style={tw`font-bold ${item.username === user.username ? 'text-right' : 'text-left'}`}>
          {item.username}
        </Text>
        {item.image ? (
          <TouchableOpacity onPress={() => handleImagePress(item.image)}>
            <Image source={{ uri: item.image }} style={tw`w-60 h-60 rounded-lg mt-2`} resizeMode="contain" />
          </TouchableOpacity>
        ) : (
          <Text style={tw`${item.username === user.username ? 'text-right' : 'text-left'}`}>
            {item.message}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <PaperProvider>
      <KeyboardAvoidingView
        style={tw`flex-1 bg-white`}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <View style={tw`flex-1`}>
          <Appbar.Header style={tw`bg-white shadow-md`}>
            <Appbar.BackAction onPress={() => navigation.goBack()} />
            <Appbar.Content title="Chat Group" />
          </Appbar.Header>
          <FlatList
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={tw`p-4`}
          />
          {imageUri && (
            <View style={tw`p-2 bg-white border-t border-gray-200 flex-row justify-center`}>
              <Image source={{ uri: imageUri }} style={tw`w-60 h-60 rounded-lg`} />
            </View>
          )}
          {isUploading && (
            <View style={tw`p-2 bg-white border-t border-gray-200 flex-row justify-center`}>
              <ActivityIndicator size="large" color="#4F46E5" />
            </View>
          )}
          <View style={tw`p-2 bg-white border-t border-gray-200`}>
            <View style={tw`flex-row items-center p-2 bg-gray-100 rounded-full shadow-sm`}>
              <TouchableOpacity onPress={selectImage} style={tw`ml-2 mr-2`}>
                <MaterialCommunityIcons name="image" size={30} color="#4F46E5" />
              </TouchableOpacity>
              <TouchableOpacity onPress={takePhoto} style={tw`ml-2 mr-2`}>
                <MaterialCommunityIcons name="camera" size={30} color="#4F46E5" />
              </TouchableOpacity>
              <View style={tw`flex-1 h-10`}>
                <TextInput
                  style={[
                    tw`h-full rounded-full px-4`,
                    { backgroundColor: 'white', color: 'black' },
                  ]}
                  placeholder="Type a message"
                  placeholderTextColor={theme.colors.placeholder}
                  value={message}
                  onChangeText={setMessage}
                />
              </View>
              <TouchableOpacity onPress={sendMessage} style={tw`ml-2`}>
                <MaterialCommunityIcons name="send-circle" size={40} color="#4F46E5" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Modal visible={!!selectedImage} transparent={true}>
          <TouchableWithoutFeedback onPress={closeImageModal}>
            <View style={tw`flex-1 bg-black bg-opacity-80 justify-center items-center`}>
              {selectedImage && (
                <Image source={{ uri: selectedImage }} style={tw`w-80 h-80`} resizeMode="contain" />
              )}
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </KeyboardAvoidingView>
    </PaperProvider>
  );
};

export default ChatScreen;
