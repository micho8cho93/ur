import { hasNakamaConfig, isNakamaEnabled } from '@/config/nakama';
import { urTheme } from '@/constants/urTheme';
import { sendPresenceHeartbeat } from '@/services/presence';
import AuthProvider from '@/src/auth/AuthProvider';
import { useAuth } from '@/src/auth/useAuth';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { LogBox, View } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import '../global.css';

LogBox.ignoreLogs([
  "SafeAreaView has been deprecated and will be removed in a future release. Please use 'react-native-safe-area-context' instead. See https://github.com/th3rdwave/react-native-safe-area-context",
]);

function RootNavigator() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!isNakamaEnabled() || !hasNakamaConfig()) {
      return;
    }

    const sendHeartbeat = async () => {
      try {
        await sendPresenceHeartbeat();
      } catch {
        // Presence heartbeat is best-effort and should not block UI.
      }
    };

    void sendHeartbeat();
    const intervalId = setInterval(() => {
      void sendHeartbeat();
    }, 10_000);

    return () => {
      clearInterval(intervalId);
    };
  }, [user]);

  return (
    <View style={{ flex: 1, backgroundColor: urTheme.colors.night }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#122736' },
          headerTintColor: urTheme.colors.parchment,
          headerShadowVisible: false,
          headerTitleStyle: {
            fontFamily: 'serif',
            fontWeight: '700',
          },
          contentStyle: { backgroundColor: urTheme.colors.night },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Royal Game of Ur', headerShown: false }} />
        <Stack.Screen name="(game)/lobby" options={{ title: 'Lobby' }} />
        <Stack.Screen name="match/[id]" options={{ title: 'Game Room', headerBackTitle: 'Lobby' }} />
        <Stack.Screen name="tutorial/watch" options={{ title: 'Tutorial (Watch)' }} />
        <Stack.Screen name="oauthredirect" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
