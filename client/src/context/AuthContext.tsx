import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import axiosInstance from '../config/axiosInstance';

interface User {
  id: string;
  username: string;
  email: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  const saveUserToLocalStorage = async (user: User) => {
    console.log('Saving user to local storage:', user);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post('/login', { email, password });
      const { access_token: token, user: userInfo } = response.data;
      const { id, username, email: userEmail } = userInfo;
      const newUser = { id, username, email: userEmail, token };
      await saveUserToLocalStorage(newUser);
      setUser(newUser);
      console.log('User logged in:', newUser);
    } catch (error) {
      console.error(error);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      await axiosInstance.post('/register', { username, email, password });
      await login(email, password);
    } catch (error) {
      console.error(error);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('user');
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isLoggedIn = async () => {
    try {
      const userString = await SecureStore.getItemAsync('user');
      if (userString) {
        const user = JSON.parse(userString);
        setUser(user);
        console.log('User loaded from local storage:', user);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
