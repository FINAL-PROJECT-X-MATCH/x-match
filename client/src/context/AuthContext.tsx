import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import axiosInstance from '../config/axiosInstance';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';

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
  loginWithGoogle: () => Promise<void>;
  checkEvent: () => Promise<void>;
  checkNotification: () => Promise<void>;
  unableToJoin: (eventId: string) => Promise<void>;
  getNotifications: () => Promise<any>;
  notificationOK: (eventId: string) => Promise<void>;
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
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '919734331309-2t68quo9tpsantm7hdcr0mtfh3938ake.apps.googleusercontent.com',
  });

  const saveUserToLocalStorage = async (user: User) => {
    await SecureStore.setItemAsync('user', JSON.stringify(user));
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post('/login', { email, password });
      const { access_token: token, user: userInfo } = response.data;
      const { id, username, email: userEmail } = userInfo;
      const newUser = { id, username, email: userEmail, token };
      await saveUserToLocalStorage(newUser);
      await SecureStore.setItemAsync('user_token', token);
      setUser(newUser);

      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        await axiosInstance.post('/users/push-token', { token: pushToken }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      console.log('User logged in:', newUser);
    } catch (error) {
      console.error(error);
    }
  };

  const loginWithGoogle = async () => {
    await promptAsync();
  };

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication) {
        (async () => {
          try {
            const res = await axiosInstance.post('/google-login', {
              token: authentication.accessToken,
            });

            const { access_token: token, user: userInfo } = res.data;
            const { id, username, email: userEmail } = userInfo;
            const newUser = { id, username, email: userEmail, token };
            await saveUserToLocalStorage(newUser);
            await SecureStore.setItemAsync('user_token', token);
            setUser(newUser);

            const pushToken = await registerForPushNotificationsAsync();
            if (pushToken) {
              await axiosInstance.post('/users/push-token', { token: pushToken }, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
            }

            console.log('User logged in with Google:', newUser);
          } catch (error) {
            console.error('Google login error:', error);
          }
        })();
      }
    }
  }, [response]);

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
      await SecureStore.deleteItemAsync('user_token');
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const checkEvent = async () => {
    try {
      const token = await SecureStore.getItemAsync('user_token');
      await axiosInstance.get('/events/check', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error checking events:', error);
    }
  };

  const checkNotification = async () => {
    try {
      const token = await SecureStore.getItemAsync('user_token');
      await axiosInstance.get('/users/check-status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  const unableToJoin = async (eventId: string) => {
    try {
      const token = await SecureStore.getItemAsync('user_token');
      await axiosInstance.delete(`/event/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error leaving event:', error);
    }
  };

  const getNotifications = async () => {
    try {
      const token = await SecureStore.getItemAsync('user_token');
      const response = await axiosInstance.get('/user/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  };

  const notificationOK = async (eventId: string) => {
    try {
      const token = await SecureStore.getItemAsync('user_token');
      await axiosInstance.delete(`/user/deleteNotif/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error acknowledging notification:', error);
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
    <AuthContext.Provider value={{ user, login, register, logout, loginWithGoogle, checkEvent, checkNotification, unableToJoin, getNotifications, notificationOK }}>
      {children}
    </AuthContext.Provider>
  );
};
