import { PLAYTHROUGH_TUTORIAL_ID } from '@/tutorials/playthroughTutorial';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function WatchTutorialScreen() {
  const router = useRouter();

  React.useEffect(() => {
    const localMatchId = `local-${Date.now()}`;
    router.replace(`/match/${localMatchId}?offline=1&tutorial=${PLAYTHROUGH_TUTORIAL_ID}&botDifficulty=easy` as never);
  }, [router]);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ActivityIndicator color="#F0C040" />
      <Text style={styles.text}>Loading the guided tutorial...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#140D08',
  },
  text: {
    color: '#F7E9CD',
    fontSize: 15,
  },
});
