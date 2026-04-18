import { Button } from '@/components/ui/Button';
import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH, WideScreenBackground } from '@/components/ui/WideScreenBackground';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { getActiveTournamentFlow } from '@/services/tournaments';
import type { ActiveTournamentFlow } from '@/src/tournaments/types';
import { useFocusEffect } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Image, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const multiplayerWideBackground = require('../../../assets/images/multiplayer_bg.png');
const multiplayerMobileBackground = require('../../../assets/images/multiplayer_bg_mobile.png');

const WAITING_ROOM_POLL_INTERVAL_MS = 4_000;

export default function ActiveTournamentWaitingRoomScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const showWideBackground = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH;
  const showMobileBackground = useMobileBackground();
  const [flow, setFlow] = useState<ActiveTournamentFlow | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const roundLabel = useMemo(() => {
    const round = flow?.pendingDestination?.round ?? flow?.currentRound ?? null;
    return typeof round === 'number' ? `Round ${round}` : 'Next round';
  }, [flow]);
  const isWaiting =
    flow?.pendingDestination?.type === 'waiting_room' && flow.state === 'waiting_next_round';

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const nextFlow = await getActiveTournamentFlow();
      setFlow(nextFlow);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to refresh tournament status.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      const interval = setInterval(() => {
        void refresh();
      }, WAITING_ROOM_POLL_INTERVAL_MS);

      return () => {
        clearInterval(interval);
      };
    }, [refresh]),
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => isWaiting);
    return () => {
      subscription.remove();
    };
  }, [isWaiting]);

  const statusTitle = (() => {
    if (!flow) {
      return 'No active tournament wait found';
    }

    if (flow.pendingDestination?.type === 'match') {
      return 'Your next board is opening';
    }

    return 'Waiting for your next opponent';
  })();

  const statusBody = (() => {
    if (!flow) {
      return 'You are free to return to the app. If a tournament match becomes ready, the app will bring you back automatically.';
    }

    if (flow.pendingDestination?.type === 'match') {
      return 'The tournament director has assigned your match. The app will move you to the board automatically.';
    }

    return 'Your place is still alive in the bracket. Once the other side of your next pairing finishes, the tournament director will send you straight to the match.';
  })();

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: 'Tournament Waiting Room',
          headerBackVisible: !isWaiting,
          gestureEnabled: !isWaiting,
          headerLeft: isWaiting ? () => null : undefined,
        }}
      />
      <WideScreenBackground
        source={multiplayerWideBackground}
        visible={showWideBackground}
        overlayColor="rgba(7, 10, 16, 0.24)"
      />
      <MobileBackground
        source={multiplayerMobileBackground}
        visible={showMobileBackground}
        overlayColor="rgba(7, 10, 16, 0.24)"
      />
      <View pointerEvents="none" style={styles.pageTexture}>
        <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.textureFill} />
      </View>
      <View pointerEvents="none" style={styles.pageGlow} />
      <View pointerEvents="none" style={styles.pageShade} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.panel}>
          <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.panelTexture} />
          <View style={styles.panelBorder} />
          <Text style={styles.eyebrow}>Active Tournament Flow</Text>
          <Text style={styles.title}>{flow?.tournamentName ?? 'Tournament Waiting Room'}</Text>
          <Text style={styles.round}>{roundLabel}</Text>
          <Text style={styles.statusTitle}>{statusTitle}</Text>
          <Text style={styles.statusBody}>{statusBody}</Text>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.statusGrid}>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillLabel}>State</Text>
              <Text style={styles.statusPillValue}>{flow?.state ?? 'released'}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillLabel}>Dispatch</Text>
              <Text style={styles.statusPillValue}>
                {flow?.pendingDestination?.type === 'waiting_room'
                  ? 'Waiting room'
                  : flow?.pendingDestination?.type === 'match'
                    ? 'Match ready'
                    : 'None'}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title={isRefreshing ? 'Refreshing...' : 'Refresh'}
              variant="outline"
              onPress={() => {
                void refresh();
              }}
            />
            {!flow ? (
              <Button
                title="Return Home"
                onPress={() => {
                  router.replace('/');
                }}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#15100B',
  },
  pageTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
  },
  textureFill: {
    width: '100%',
    height: '100%',
  },
  pageGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(244, 196, 106, 0.08)',
  },
  pageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 8, 14, 0.48)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: urTheme.spacing.lg,
    paddingVertical: urTheme.spacing.xl,
  },
  panel: {
    width: '100%',
    maxWidth: 760,
    overflow: 'hidden',
    borderRadius: urTheme.radii.lg,
    borderWidth: 2,
    borderColor: 'rgba(238, 198, 118, 0.48)',
    backgroundColor: 'rgba(36, 24, 14, 0.92)',
    padding: urTheme.spacing.xl,
    alignItems: 'center',
    gap: urTheme.spacing.md,
    ...boxShadow({
      color: '#000000',
      opacity: 0.34,
      blurRadius: 22,
      offset: { width: 0, height: 14 },
      elevation: 10,
    }),
  },
  panelTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  panelBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  eyebrow: {
    color: '#E8C06C',
    fontFamily: urTypography.label.fontFamily,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: urTheme.colors.parchment,
    fontFamily: urTypography.title.fontFamily,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  round: {
    color: '#F4D189',
    fontFamily: urTypography.title.fontFamily,
    fontSize: 20,
    fontWeight: '800',
  },
  statusTitle: {
    color: urTheme.colors.parchment,
    fontFamily: urTypography.title.fontFamily,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  statusBody: {
    maxWidth: 560,
    color: 'rgba(247, 229, 203, 0.82)',
    fontFamily: urTypography.subtitle.fontFamily,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  errorBanner: {
    width: '100%',
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 132, 112, 0.42)',
    backgroundColor: 'rgba(98, 34, 28, 0.42)',
    padding: urTheme.spacing.md,
  },
  errorText: {
    color: '#FFD7CF',
    fontFamily: urTypography.subtitle.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusGrid: {
    width: '100%',
    flexDirection: 'row',
    gap: urTheme.spacing.md,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  statusPill: {
    minWidth: 180,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(244, 209, 137, 0.32)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: urTheme.spacing.md,
    alignItems: 'center',
  },
  statusPillLabel: {
    color: 'rgba(247, 229, 203, 0.62)',
    fontFamily: urTypography.label.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statusPillValue: {
    marginTop: 4,
    color: urTheme.colors.parchment,
    fontFamily: urTypography.title.fontFamily,
    fontSize: 17,
    fontWeight: '900',
  },
  actions: {
    marginTop: urTheme.spacing.sm,
    flexDirection: 'row',
    gap: urTheme.spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
