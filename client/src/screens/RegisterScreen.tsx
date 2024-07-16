import React, { useState, useCallback } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  TouchableOpacity, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Animated,
  StatusBar,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import tw from 'twrnc';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

type Props = {
  navigation: RegisterScreenNavigationProp;
};

const { height } = Dimensions.get('window');

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRegister = useCallback(async () => {
    if (!username || !email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all fields',
      });
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password);
    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [username, email, password, register]);

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-[#f97316]`}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle="light-content" backgroundColor="#f97316" />
      <View style={tw`flex-1`}>
        <View style={[tw`items-center justify-end`, { height: height * 0.35 }]}>
          <Image 
            source={require('../../assets/LogoX-Match.png')} 
            style={tw`w-40 h-40 mb-4`}
            resizeMode="contain"
          />
          <Text style={tw`text-white text-3xl font-bold mb-4`}>Create Account</Text>
        </View>
        
        <Animated.View 
          style={[
            tw`bg-white rounded-t-[40px] px-8 pt-10 pb-8 flex-1`,
            { 
              opacity: fadeAnim,
              transform: [{ 
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })
              }] 
            }
          ]}
        >
          <View style={tw`mb-6`}>
            <View style={tw`bg-gray-100 rounded-xl flex-row items-center px-4 py-3 mb-4`}>
              <Ionicons name="person-outline" size={24} color="#f97316" style={tw`mr-3`} />
              <TextInput
                placeholder="Enter Username"
                value={username}
                onChangeText={setUsername}
                style={tw`flex-1 text-gray-800 text-base`}
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={tw`bg-gray-100 rounded-xl flex-row items-center px-4 py-3 mb-4`}>
              <Ionicons name="mail-outline" size={24} color="#f97316" style={tw`mr-3`} />
              <TextInput
                placeholder="Enter Email"
                value={email}
                onChangeText={setEmail}
                style={tw`flex-1 text-gray-800 text-base`}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={tw`bg-gray-100 rounded-xl flex-row items-center px-4 py-3 mb-4`}>
              <Ionicons name="lock-closed-outline" size={24} color="#f97316" style={tw`mr-3`} />
              <TextInput
                placeholder="Enter Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={tw`flex-1 text-gray-800 text-base`}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
          <TouchableOpacity 
            style={tw`bg-[#f97316] py-4 rounded-xl mb-4 shadow-md`}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={tw`text-center text-lg font-bold text-white`}>Register</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={tw`text-center text-[#f97316] font-medium`}>Already have an account? Login Here</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      <Toast />
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;