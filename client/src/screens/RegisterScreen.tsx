import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

type Props = {
  navigation: RegisterScreenNavigationProp;
};

const RegisterScreen = ({ navigation }: Props) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/LogoX-Match.png')} style={styles.logo} />
        </View>
        <View style={styles.inputContainer}>
          <MaterialIcons name="person" size={24} color="gray" style={styles.icon} />
          <TextInput
            placeholder="Enter Username"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            autoCapitalize="none"
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={24} color="gray" style={styles.icon} />
          <TextInput
            placeholder="Enter Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={24} color="gray" style={styles.icon} />
          <TextInput
            placeholder="Enter Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#888"
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={() => register(username, email, password)}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginLink}>Login Here</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 150, 
    height: 150,
    resizeMode: 'contain',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 25,
    paddingHorizontal: 10,
    marginBottom: 12,
    backgroundColor: '#f7f7f7', 
  },
  icon: {
    marginHorizontal: 5,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 8,
    color: '#333',
  },
  button: {
    height: 50,
    backgroundColor: '#4F46E5', 
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginVertical: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginText: {
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
  loginLink: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
