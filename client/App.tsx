import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import Toast from 'react-native-toast-message';
import { registerForPushNotificationsAsync, scheduleLocalNotification } from './src/utils/notifications';

export default function App() {
  useEffect(() => {
   
    registerForPushNotificationsAsync();

    
    const trigger = new Date(Date.now() + 60 * 1000);
    scheduleLocalNotification('X-Match', 'Welcome to X-Match', {}, trigger);
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
      <Toast />
    </AuthProvider>
  );
}
