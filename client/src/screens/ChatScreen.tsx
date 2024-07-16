import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const socketUrl = 'https://8eb4-36-68-222-140.ngrok-free.app ';

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
  createdAt: string;
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
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
      scrollToBottom();
    });

    newSocket.emit('join', { eventId, userId: user.id });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

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
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [eventId]);

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const sendMessage = async () => {
    if (!socket || !user || isUploading || (!message.trim() && !imageUri)) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('eventId', eventId);
    formData.append('message', message.trim());
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
      scrollToBottom();
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
      setImageUri(imageUri);
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

  const renderItem = ({ item }: { item: Message }) => {
    const isCurrentUser = item.username === user?.username;
    return (
      <Animated.View
        style={[
          tw`mb-2 flex-row items-end`,
          isCurrentUser ? tw`justify-end` : tw`justify-start`,
          { opacity: fadeAnim },
        ]}
        key={item._id}
      >
        <LinearGradient
          colors={isCurrentUser ? [ 'rgb(253 186 116)','rgb(251 146 60)', 'rgb(253 186 116)'] : ['rgb(255 247 237)', 'rgb(229 231 235)']}
          style={[
            tw`max-w-[80%] p-3 rounded-2xl shadow-md`,
            isCurrentUser ? tw`rounded-br-none` : tw`rounded-bl-none`,
          ]}
        >
          <Text style={tw`font-bold ${isCurrentUser ? 'text-white' : 'text-gray-800'}`}>
            {item.username}
          </Text>
          {item.image ? (
            <TouchableOpacity onPress={() => handleImagePress(item.image)}>
              <Image source={{ uri: item.image }} style={tw`w-60 h-60 rounded-lg mt-2`} resizeMode="cover" />
            </TouchableOpacity>
          ) : (
            <Text style={tw`${isCurrentUser ? 'text-white' : 'text-gray-800'} mt-1`}>
              {item.message}
            </Text>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <PaperProvider>
      <LinearGradient colors={['rgb(255 247 237)', 'rgb(229 231 235)']} style={tw`flex-1`}>
        <KeyboardAvoidingView
          style={tw`flex-1`}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={80}
        >
          <Appbar.Header style={tw`bg-transparent shadow-none`}>
            <Appbar.BackAction onPress={() => navigation.goBack()} color="rgb(251 146 60)" />
            <Appbar.Content title="Chat Group" titleStyle={tw`text-gray-800 font-bold`} />
          </Appbar.Header>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={tw`p-4`}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
          />
          {imageUri && (
            <BlurView intensity={100} tint="light" style={tw`p-2 border-t border-gray-200 flex-row justify-center`}>
              <Image source={{ uri: imageUri }} style={tw`w-60 h-60 rounded-lg`} />
            </BlurView>
          )}
          {isUploading && (
            <BlurView intensity={100} tint="light" style={tw`p-2 border-t border-gray-200 flex-row justify-center`}>
              <ActivityIndicator size="large" color="rgb(251 146 60)" />
            </BlurView>
          )}
          <BlurView intensity={100} tint="light" style={tw`p-2 border-t border-gray-200`}>
            <View style={tw`flex-row items-center p-2 bg-white rounded-full shadow-md`}>
              <TouchableOpacity onPress={selectImage} style={tw`ml-2 mr-2`}>
                <MaterialCommunityIcons name="image" size={24} color="rgb(251 146 60)" />
              </TouchableOpacity>
              <TouchableOpacity onPress={takePhoto} style={tw`ml-2 mr-2`}>
                <MaterialCommunityIcons name="camera" size={24} color="rgb(251 146 60)" />
              </TouchableOpacity>
              <View style={tw`flex-1 h-10`}>
                <TextInput
                  style={tw`h-full rounded-full px-4 bg-gray-100 text-gray-800`}
                  placeholder="Type a message"
                  placeholderTextColor="#9CA3AF"
                  value={message}
                  onChangeText={setMessage}
                />
              </View>
              <TouchableOpacity onPress={sendMessage} style={tw`ml-2 bg-orange-600 rounded-full p-2`}>
                <MaterialCommunityIcons name="send" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
        <Modal visible={!!selectedImage} transparent={true}>
          <TouchableWithoutFeedback onPress={closeImageModal}>
            <BlurView intensity={100} tint="dark" style={tw`flex-1 justify-center items-center`}>
              {selectedImage && (
                <Image source={{ uri: selectedImage }} style={tw`w-full h-80`} resizeMode="contain" />
              )}
            </BlurView>
          </TouchableWithoutFeedback>
        </Modal>
      </LinearGradient>
    </PaperProvider>
  );
};

export default ChatScreen;
