import { ProtectedRoute } from '@/src/screens/ProtectedRoute';
import { urTheme } from '@/constants/urTheme';
import { HOME_FREDOKA_FONT_FAMILY } from '@/src/home/homeTheme';
import { Stack } from 'expo-router';

export default function GameLayout() {
  return (
    <ProtectedRoute>
      <Stack
        screenOptions={{
          headerTransparent: true,
          headerBackground: () => null,
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: urTheme.colors.parchment,
          headerShadowVisible: false,
          headerTitleStyle: {
            fontFamily: HOME_FREDOKA_FONT_FAMILY,
            fontWeight: '700',
          },
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="lobby" options={{ title: 'Lobby' }} />
        <Stack.Screen name="bot" options={{ title: 'Bot Match' }} />
        <Stack.Screen name="game-modes" options={{ title: 'Game Modes' }} />
        <Stack.Screen name="store" options={{ title: 'Store' }} />
        <Stack.Screen name="inventory" options={{ title: 'Inventory' }} />
        <Stack.Screen name="tournaments/index" options={{ title: 'Tournaments' }} />
        <Stack.Screen name="tournaments/[runId]" options={{ title: 'Tournament' }} />
      </Stack>
    </ProtectedRoute>
  );
}
