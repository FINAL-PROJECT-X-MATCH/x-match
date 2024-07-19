import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import axiosInstance from '../config/axiosInstance';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import * as Google from 'expo-auth-session/providers/google';

interface Status {
  ban: boolean;
  duration: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  token: string;
  status: Status;
  member: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
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
    webClientId: "807256542957-fs0dac8c3cc01p5d4641i2imne81ff4q.apps.googleusercontent.com",
    androidClientId: "807256542957-ldj0hglfg78b4lbn923f1658s4o11j01.apps.googleusercontent.com",
    iosClientId: "807256542957-2dgs18k6qm31mnkpvu3bo2k6gmf4pqqe.apps.googleusercontent.com"
  });

  const saveUserToLocalStorage = async (user: User) => {
    await SecureStore.setItemAsync('user', JSON.stringify(user));
  };

  const createUserObject = (userInfo: any, token: string): User => {
    return {
      id: userInfo.id,
      username: userInfo.username,
      email: userInfo.email,
      token: token,
      status: userInfo.status,
      member: userInfo.member
    };
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post('/login', { email, password });
      console.log('Server response:', response.data);
      const { access_token: token, user: userInfo } = response.data;
      const newUser = createUserObject(userInfo, token);
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
      console.error('Login error:', error);
      throw error;
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
            console.log('Google login server response:', res.data);
            const { access_token: token, user: userInfo } = res.data;
            const newUser = createUserObject(userInfo, token);
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
      const response = await axiosInstance.post('/register', { username, email, password });
      console.log('Register response:', response.data);
      const { access_token: token, user: userInfo } = response.data;
      const newUser = createUserObject(userInfo, token);
      await saveUserToLocalStorage(newUser);
      await SecureStore.setItemAsync('user_token', token);
      setUser(newUser);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
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

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prevUser) => {
      if (prevUser) {
        const newUser = { ...prevUser, ...updatedUser };
        saveUserToLocalStorage(newUser);
        return newUser;
      }
      return prevUser;
    });
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
        const userData = JSON.parse(userString);
        setUser(userData);
        console.log('User loaded from local storage:', userData);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      loginWithGoogle, 
      updateUser,
      checkEvent, 
      checkNotification, 
      unableToJoin, 
      getNotifications, 
      notificationOK
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
