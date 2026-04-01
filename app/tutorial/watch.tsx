import { PLAYTHROUGH_TUTORIAL_ID } from '@/tutorials/playthroughTutorial';
import { useScreenTransition } from '@/src/transitions/ScreenTransitionContext';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function WatchTutorialScreen() {
  const router = useRouter();
  const runScreenTransition = useScreenTransition();

  React.useEffect(() => {
    const localMatchId = `local-${Date.now()}`;
    const navigate = () =>
      router.replace(`/match/${localMatchId}?offline=1&tutorial=${PLAYTHROUGH_TUTORIAL_ID}&botDifficulty=easy` as never);

    void runScreenTransition({
      title: 'Preparing Tutorial',
      message: 'Laying out the guided board and loading the lesson.',
      preActionDelayMs: 980,
      postActionDelayMs: 260,
      action: navigate,
    }).then((didStart) => {
      if (!didStart) {
        navigate();
      }
    });
  }, [router, runScreenTransition]);

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
