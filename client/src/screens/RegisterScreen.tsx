import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { LinearGradient } from 'expo-linear-gradient';
import tw from 'twrnc';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

type Props = {
  navigation: RegisterScreenNavigationProp;
};

const RegisterScreen = ({ navigation }: Props) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register } = useAuth();

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      await register(username, email, password);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1`}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <LinearGradient colors={['rgb(234 88 12)', 'rgb(249 115 22)', 'rgb(253 186 116)']} style={tw`flex-1`}>
        <ScrollView contentContainerStyle={tw`flex-grow justify-center p-5`}>
          <View style={tw`items-center mb-10`}>
            <Image source={require('../../assets/LogoX-Match.png')} style={tw`w-40 h-40 mb-6`} />
            <Text style={tw`text-white text-4xl font-bold`}>Create Account</Text>
          </View>
          {error && <Text style={tw`text-red-500 text-center mb-4`}>{error}</Text>}
          <View style={tw`mb-4`}>
            <View style={tw`flex-row items-center border border-gray-300 rounded-full p-3 mb-4 bg-gray-100 shadow-sm`}>
              <Ionicons name="person-outline" size={24} color="gray" style={tw`mr-2`} />
              <TextInput
                placeholder="Enter Username"
                value={username}
                onChangeText={setUsername}
                style={tw`flex-1 text-gray-800 text-lg`}
                autoCapitalize="none"
                placeholderTextColor="#888"
              />
            </View>
            <View style={tw`flex-row items-center border border-gray-300 rounded-full p-3 mb-4 bg-gray-100 shadow-sm`}>
              <Ionicons name="mail-outline" size={24} color="gray" style={tw`mr-2`} />
              <TextInput
                placeholder="Enter Email"
                value={email}
                onChangeText={setEmail}
                style={tw`flex-1 text-gray-800 text-lg`}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#888"
              />
            </View>
            <View style={tw`flex-row items-center border border-gray-300 rounded-full p-3 bg-gray-100 shadow-sm`}>
              <Ionicons name="lock-closed-outline" size={24} color="gray" style={tw`mr-2`} />
              <TextInput
                placeholder="Enter Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={tw`flex-1 text-gray-800 text-lg`}
                placeholderTextColor="#888"
              />
            </View>
          </View>
          <TouchableOpacity style={tw`bg-orange-600 p-4 rounded-full mb-4 shadow-md`} onPress={handleRegister}>
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={tw`text-center text-lg font-bold text-white`}>Register</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={tw`text-center text-white`}>Already have an account? Login Here</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
