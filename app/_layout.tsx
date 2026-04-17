import { urTheme } from '@/constants/urTheme';
import { AuthProvider } from '@/src/auth/AuthProvider';
import { ChallengesProvider } from '@/src/challenges/ChallengesContext';
import { EloRatingProvider } from '@/src/elo/EloContext';
import { ProgressionProvider } from '@/src/progression/ProgressionContext';
import { InventoryProvider, useInventory } from '@/src/store/InventoryContext';
import { StoreProvider } from '@/src/store/StoreProvider';
import { CosmeticThemeProvider } from '@/src/store/CosmeticThemeContext';
import { ScreenTransitionProvider } from '@/src/transitions/ScreenTransitionContext';
import { WalletProvider } from '@/src/wallet/WalletContext';
import {
  HOME_FREDOKA_FONT_FAMILY,
  HOME_GROBOLD_FONT_FAMILY,
  HOME_SUPERCELL_FONT_FAMILY,
} from '@/src/home/homeTheme';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { LogBox, Platform, View } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import '../global.css';

LogBox.ignoreLogs([
  "SafeAreaView has been deprecated and will be removed in a future release. Please use 'react-native-safe-area-context' instead. See https://github.com/th3rdwave/react-native-safe-area-context",
]);

function RootNavigator() {
  const rootFadeAnimation = Platform.OS === 'ios' || Platform.OS === 'android' ? 'fade' : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: urTheme.colors.night }}>
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
        <Stack.Screen name="index" options={{ title: 'Royal Game of Ur', headerShown: false }} />
        <Stack.Screen name="challenges" options={{ title: 'Challenges' }} />
        <Stack.Screen name="leaderboard" options={{ title: 'Elo Leaderboard' }} />
        <Stack.Screen name="username-onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="(game)"
          options={{
            headerShown: false,
            ...(rootFadeAnimation ? { animation: rootFadeAnimation } : {}),
          }}
        />
        <Stack.Screen
          name="match"
          options={{
            headerShown: false,
            ...(rootFadeAnimation ? { animation: rootFadeAnimation } : {}),
          }}
        />
        <Stack.Screen name="tutorial" options={{ headerShown: false }} />
        <Stack.Screen name="oauthredirect" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

function AppThemeShell() {
  const { equippedTheme } = useInventory();

  return (
    <CosmeticThemeProvider theme={equippedTheme}>
      <RootNavigator />
    </CosmeticThemeProvider>
  );
}

export default function Layout() {
  const [fontsLoaded] = useFonts({
    [HOME_FREDOKA_FONT_FAMILY]: require('../assets/fonts/LilitaOne-Regular.ttf'),
    [HOME_GROBOLD_FONT_FAMILY]: require('../assets/fonts/LilitaOne-Regular.ttf'),
    [HOME_SUPERCELL_FONT_FAMILY]: require('../assets/fonts/Supercell-Magic-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <AuthProvider>
        <EloRatingProvider>
          <ProgressionProvider>
            <WalletProvider>
              <ChallengesProvider>
                <StoreProvider>
                  <InventoryProvider>
                    <ScreenTransitionProvider>
                      <AppThemeShell />
                    </ScreenTransitionProvider>
                  </InventoryProvider>
                </StoreProvider>
              </ChallengesProvider>
            </WalletProvider>
          </ProgressionProvider>
        </EloRatingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
