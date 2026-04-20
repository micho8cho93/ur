import { HomeActionButton } from '@/components/home/HomeActionButton';
import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { SketchButton } from '@/components/ui/SketchButton';
import {
  MIN_WIDE_WEB_BACKGROUND_WIDTH,
  WideScreenBackground,
} from '@/components/ui/WideScreenBackground';
import {
  urPanelColors,
  urTextColors,
  urTextVariants,
  urTheme,
} from '@/constants/urTheme';
import { getMatchConfig } from '@/logic/matchConfigs';
import { listSpectatableMatches, type SpectatableMatch } from '@/services/matchmaking';
import { resolveGameModeMatchConfig } from '@/services/gameModes';
import { nakamaService } from '@/services/nakama';
import {
  HOME_FREDOKA_FONT_FAMILY,
  HOME_GROBOLD_FONT_FAMILY,
  HOME_SUPERCELL_FONT_FAMILY,
  resolveHomeButtonFontFamily,
  resolveHomeFredokaFontFamily,
  resolveHomeMagicFontFamily,
} from '@/src/home/homeTheme';
import { buildMatchRoutePath } from '@/src/match/buildMatchRoutePath';
import { useGameStore } from '@/store/useGameStore';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const homeWideBackground = require('../../assets/images/bg_online.png');
const homeMobileBackground = require('../../assets/images/bg_online_mobile.png');

const formatShortMatchId = (matchId: string): string => {
  const parts = matchId.split('.');
  const compactId = parts[parts.length - 1] || matchId;
  return compactId.length > 10 ? `${compactId.slice(0, 6)}...${compactId.slice(-4)}` : compactId;
};

const getPlayerLabel = (match: SpectatableMatch, index: number): string =>
  match.playerLabels[index] ?? (index === 0 ? 'Light Player' : 'Dark Player');

export default function SpectateScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [matches, setMatches] = useState<SpectatableMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [watchingMatchId, setWatchingMatchId] = useState<string | null>(null);
  const initGame = useGameStore((state) => state.initGame);
  const setNakamaSession = useGameStore((state) => state.setNakamaSession);
  const setUserId = useGameStore((state) => state.setUserId);
  const setMatchToken = useGameStore((state) => state.setMatchToken);
  const setOnlineMode = useGameStore((state) => state.setOnlineMode);
  const setPlayerColor = useGameStore((state) => state.setPlayerColor);
  const setSocketState = useGameStore((state) => state.setSocketState);
  const showWideBackground = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH;
  const showMobileBackground = useMobileBackground();
  const isCompactLayout = width < 820;
  const isDesktopViewport = Platform.OS === 'web' && width >= 920;
  const horizontalPadding = isDesktopViewport ? urTheme.spacing.lg : urTheme.spacing.md;
  const topPadding = insets.top + (isDesktopViewport ? 12 : 8);
  const bottomPadding = insets.bottom + (isCompactLayout ? urTheme.spacing.xl : urTheme.spacing.lg);
  const stageWidth = isDesktopViewport
    ? Math.min(width - horizontalPadding * 2, 1080)
    : isCompactLayout
      ? Math.min(width - horizontalPadding * 2, 430)
      : Math.min(width - horizontalPadding * 2, 820);
  const [fontsLoaded] = useFonts({
    [HOME_FREDOKA_FONT_FAMILY]: require('../../assets/fonts/LilitaOne-Regular.ttf'),
    [HOME_GROBOLD_FONT_FAMILY]: require('../../assets/fonts/LilitaOne-Regular.ttf'),
    [HOME_SUPERCELL_FONT_FAMILY]: require('../../assets/fonts/Supercell-Magic-Regular.ttf'),
  });
  const titleFontFamily = resolveHomeMagicFontFamily(fontsLoaded);
  const bodyFontFamily = resolveHomeFredokaFontFamily(fontsLoaded);
  const buttonFontFamily = resolveHomeButtonFontFamily(fontsLoaded);

  const refreshMatches = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setMatches(await listSpectatableMatches());
    } catch (error) {
      setMatches([]);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load live matches.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMatches();
  }, [refreshMatches]);

  const watchMatch = useCallback(
    async (match: SpectatableMatch) => {
      setWatchingMatchId(match.matchId);
      setErrorMessage(null);

      try {
        const session = await nakamaService.ensureAuthenticatedDevice();
        if (!session.user_id) {
          throw new Error('Authenticated session is missing user ID.');
        }

        setNakamaSession(session);
        setUserId(session.user_id);
        setOnlineMode('nakama');
        setMatchToken(null);
        setPlayerColor(null);
        setSocketState('idle');
        initGame(match.matchId, {
          matchConfig: await resolveGameModeMatchConfig(match.modeId, {
            allowsXp: true,
            allowsChallenges: true,
            allowsCoins: true,
            allowsOnline: true,
            allowsRankedStats: true,
            isPracticeMode: false,
          }),
        });
        router.push(
          buildMatchRoutePath({
            id: match.matchId,
            modeId: match.modeId,
            spectator: true,
          }) as never,
        );
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to watch that match.');
        setWatchingMatchId(null);
      }
    },
    [
      initGame,
      router,
      setMatchToken,
      setNakamaSession,
      setOnlineMode,
      setPlayerColor,
      setSocketState,
      setUserId,
    ],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.screen}>
        <WideScreenBackground
          source={homeWideBackground}
          visible={showWideBackground}
          overlayColor={urPanelColors.sceneOverlay}
        />
        <MobileBackground
          source={homeMobileBackground}
          visible={showMobileBackground}
          overlayColor={urPanelColors.sceneOverlay}
        />
        <View pointerEvents="none" style={styles.backgroundTint} />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              minHeight: height,
              paddingTop: topPadding,
              paddingBottom: bottomPadding,
              paddingHorizontal: horizontalPadding,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBar}>
            <SketchButton
              label="Back"
              accessibilityLabel="Back to online play"
              onPress={() => router.dismissTo('/(game)/lobby?mode=online')}
              iconName="arrow-back"
              fontFamily={buttonFontFamily}
            />
          </View>

          <View style={[styles.stage, { width: stageWidth }]}>
            <View style={styles.hero}>
              <Text
                style={[
                  styles.pageTitle,
                  isCompactLayout ? styles.pageTitleCompact : styles.pageTitleDesktop,
                  { fontFamily: titleFontFamily },
                ]}
              >
                Live Matches
              </Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={[styles.errorBannerText, { fontFamily: bodyFontFamily }]}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {isLoading ? (
              <View style={styles.stateCard}>
                <Text style={[styles.stateTitle, { fontFamily: titleFontFamily }]}>
                  Loading live matches...
                </Text>
                <Text style={[styles.stateText, { fontFamily: bodyFontFamily }]}>
                  Checking public tables already in progress.
                </Text>
              </View>
            ) : matches.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={[styles.stateTitle, { fontFamily: titleFontFamily }]}>
                  No live matches right now
                </Text>
                <Text style={[styles.stateText, { fontFamily: bodyFontFamily }]}>
                  Public matches appear here once both players have started.
                </Text>
                <View style={styles.stateAction}>
                  <HomeActionButton
                    title="Refresh"
                    tone="gold"
                    compact={isCompactLayout}
                    fontLoaded={fontsLoaded}
                    onPress={() => void refreshMatches()}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.cardList}>
                {matches.map((match) => {
                  const config = match.displayName ?? getMatchConfig(match.modeId).displayName;
                  const isWatching = watchingMatchId === match.matchId;

                  return (
                    <Pressable
                      key={match.matchId}
                      accessibilityRole="button"
                      accessibilityLabel={`Watch match ${formatShortMatchId(match.matchId)}`}
                      disabled={watchingMatchId !== null}
                      onPress={() => void watchMatch(match)}
                      style={({ pressed }) => [
                        styles.matchCard,
                        pressed && !watchingMatchId && styles.matchCardPressed,
                        watchingMatchId !== null && !isWatching && styles.matchCardDisabled,
                      ]}
                    >
                      <View style={styles.matchCardHeader}>
                        <View>
                          <Text style={[styles.matchEyebrow, { fontFamily: bodyFontFamily }]}>
                            Match {formatShortMatchId(match.matchId)}
                          </Text>
                          <Text style={[styles.matchTitle, { fontFamily: titleFontFamily }]}>
                            {getPlayerLabel(match, 0)} vs {getPlayerLabel(match, 1)}
                          </Text>
                        </View>
                        <View style={styles.statusPill}>
                          <Text style={[styles.statusPillText, { fontFamily: bodyFontFamily }]}>
                            In Progress
                          </Text>
                        </View>
                      </View>

                      <View style={styles.matchMetaRow}>
                        <Text style={[styles.matchMetaText, { fontFamily: bodyFontFamily }]}>
                          {config}
                        </Text>
                        <Text style={[styles.watchText, { fontFamily: bodyFontFamily }]}>
                          {isWatching ? 'Opening...' : 'Watch'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#43250F',
  },
  backgroundTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: urPanelColors.sceneOverlay,
  },
  scrollContent: {
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: urTheme.spacing.sm,
  },
  stage: {
    width: '100%',
    alignItems: 'center',
    gap: urTheme.spacing.md,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    gap: urTheme.spacing.sm,
  },
  pageTitle: {
    color: urTextColors.titleOnScene,
    textAlign: 'center',
    ...urTextVariants.displayTitle,
  },
  pageTitleDesktop: {
    fontSize: 30,
    lineHeight: 34,
  },
  pageTitleCompact: {
    fontSize: 30,
    lineHeight: 34,
  },
  errorBanner: {
    width: '100%',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 79, 65, 0.24)',
    backgroundColor: 'rgba(255, 236, 226, 0.82)',
  },
  errorBannerText: {
    color: '#9B4438',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  stateCard: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: urPanelColors.parchmentBorder,
    backgroundColor: urPanelColors.parchmentSurface,
  },
  stateTitle: {
    color: urTextColors.titleOnPanel,
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center',
    ...urTextVariants.sectionTitle,
  },
  stateText: {
    color: urTextColors.bodyOnPanel,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 620,
    ...urTextVariants.body,
  },
  stateAction: {
    width: '100%',
    maxWidth: 280,
    marginTop: 8,
  },
  cardList: {
    width: '100%',
    gap: 14,
  },
  matchCard: {
    width: '100%',
    gap: 16,
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: urPanelColors.parchmentBorder,
    backgroundColor: urPanelColors.parchmentSurface,
  },
  matchCardPressed: {
    transform: [{ translateY: 1 }],
    backgroundColor: urPanelColors.parchmentSurfaceStrong,
  },
  matchCardDisabled: {
    opacity: 0.62,
  },
  matchCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  matchEyebrow: {
    color: urTextColors.captionOnPanel,
    fontSize: 12,
    lineHeight: 16,
    ...urTextVariants.caption,
  },
  matchTitle: {
    color: urTextColors.titleOnPanel,
    fontSize: 21,
    lineHeight: 26,
    ...urTextVariants.sectionTitle,
  },
  statusPill: {
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(93, 177, 31, 0.42)',
    backgroundColor: 'rgba(93, 177, 31, 0.14)',
  },
  statusPillText: {
    color: '#386914',
    fontSize: 12,
    lineHeight: 14,
    ...urTextVariants.caption,
  },
  matchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  matchMetaText: {
    color: urTextColors.bodyOnPanel,
    fontSize: 14,
    lineHeight: 19,
    ...urTextVariants.body,
  },
  watchText: {
    color: urTextColors.titleOnPanel,
    fontSize: 15,
    lineHeight: 19,
    ...urTextVariants.body,
  },
});
