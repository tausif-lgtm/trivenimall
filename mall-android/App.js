import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import * as Font from 'expo-font';
import * as Notifications from 'expo-notifications';
import { io } from 'socket.io-client';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { API_BASE } from './src/lib/api';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const SERVER_BASE = API_BASE.replace('/api', '');

// Inner component that can access AuthContext
function NotificationSetup() {
  const { user, token } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    // Request notification permissions
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
    })();
  }, []);

  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to socket.io with auth token
    const socket = io(SERVER_BASE, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionDelay: 3000,
    });

    socketRef.current = socket;

    const showNotif = (title, body, data = {}) => {
      Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true, data },
        trigger: null,
      });
    };

    // notification:new — from notificationController (tickets, assignments, etc.)
    socket.on('notification:new', (notif) => {
      showNotif(notif.title || 'Triveni Mall', notif.message || '', { ticket_id: notif.ticket_id });
    });

    // notification — from checklistController
    socket.on('notification', (notif) => {
      showNotif(notif.title || 'Triveni Mall', notif.message || '');
    });

    // ticket events (for admin_room / assigned staff)
    socket.on('ticket:created', (ticket) => {
      showNotif('New Ticket', ticket?.title || 'A new ticket has been submitted.');
    });

    socket.on('ticket:assigned', (ticket) => {
      showNotif('Ticket Assigned to You', `"${ticket?.title || 'A ticket'}" has been assigned to you.`);
    });

    socket.on('ticket:updated', (data) => {
      showNotif('Ticket Updated', 'A ticket you are following has been updated.');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, token]);

  return null;
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      'Ionicons':      require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
      'MaterialIcons': require('./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),
    })
      .catch(() => {})
      .finally(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationSetup />
          <StatusBar style="light" />
          <AppNavigator />
          <Toast />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
