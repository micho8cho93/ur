import { HomeActionButton } from '@/components/home/HomeActionButton';
import { TournamentCard } from '@/components/tournaments/TournamentCard';
import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { SketchButton } from '@/components/ui/SketchButton';
import {
  MIN_WIDE_WEB_BACKGROUND_WIDTH,
  WideScreenBackground,
} from '@/components/ui/WideScreenBackground';
import { urTheme } from '@/constants/urTheme';
import {
  HOME_FREDOKA_FONT_FAMILY,
  HOME_SUPERCELL_FONT_FAMILY,
  resolveHomeFredokaFontFamily,
  resolveHomeMagicFontFamily,
} from '@/src/home/homeTheme';
import { useTournamentList } from '@/src/tournaments/useTournamentList';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const homeWideBackground = require('../../../assets/images/home_bg.png');
const homeMobileBackground = require('../../../assets/images/home_bg_mobile.png');

export default function PublicTournamentBrowseScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [confirmJoinRunId, setConfirmJoinRunId] = useState<string | null>(null);
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
    [HOME_FREDOKA_FONT_FAMILY]: require('../../../assets/fonts/Fredoka-VariableFont_wdth,wght.ttf'),
    [HOME_SUPERCELL_FONT_FAMILY]: require('../../../assets/fonts/Supercell-Magic-Regular.ttf'),
  });
  const titleFontFamily = resolveHomeMagicFontFamily(fontsLoaded);
  const bodyFontFamily = resolveHomeFredokaFontFamily(fontsLoaded);
  const {
    tournaments,
    isLoading,
    errorMessage,
    joinTournament,
    launchMatch,
    joiningRunId,
    launchingRunId,
  } = useTournamentList();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.screen}>
        <WideScreenBackground
          source={homeWideBackground}
          visible={showWideBackground}
          overlayColor="rgba(56, 30, 13, 0.08)"
        />
        <MobileBackground
          source={homeMobileBackground}
          visible={showMobileBackground}
          overlayColor="rgba(56, 30, 13, 0.08)"
        />
        <View style={styles.backgroundTint} />

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
          <View style={[styles.stage, { width: stageWidth }]}>
            <View style={styles.topBar}>
              <SketchButton
                label="Back"
                accessibilityLabel="Back to online play"
                onPress={() => router.replace('/(game)/lobby?mode=online')}
                iconName="arrow-back"
                fontFamily={bodyFontFamily}
              />
            </View>

            <View style={styles.hero}>
              <Text style={[styles.pageEyebrow, { fontFamily: bodyFontFamily }]}>
                Public Tournament Board
              </Text>
              <Text
                style={[
                  styles.pageTitle,
                  isCompactLayout ? styles.pageTitleCompact : styles.pageTitleDesktop,
                  { fontFamily: titleFontFamily },
                ]}
              >
                Public Tournaments
              </Text>
              <Text style={[styles.pageSubtitle, { fontFamily: bodyFontFamily }]}>
                Browse every open tournament run, inspect the standings first, then join or launch from the panel without losing any of the existing tournament logic.
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
                  Loading tournaments...
                </Text>
                <Text style={[styles.stateText, { fontFamily: bodyFontFamily }]}>
                  Summoning the latest public runs from the royal archive.
                </Text>
              </View>
            ) : tournaments.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={[styles.stateTitle, { fontFamily: titleFontFamily }]}>
                  No tournaments are open right now
                </Text>
                <Text style={[styles.stateText, { fontFamily: bodyFontFamily }]}>
                  Check back soon for the next public run.
                </Text>
                <View style={styles.stateAction}>
                  <HomeActionButton
                    title="Return to Lobby"
                    tone="gold"
                    compact={isCompactLayout}
                    fontLoaded={fontsLoaded}
                    onPress={() => router.replace('/(game)/lobby?mode=online')}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.cardList}>
                {tournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament.runId}
                    tournament={tournament}
                    fontLoaded={fontsLoaded}
                    joining={joiningRunId === tournament.runId}
                    launching={launchingRunId === tournament.runId}
                    primaryTitle={confirmJoinRunId === tournament.runId ? 'Confirm' : undefined}
                    onJoin={(selected) => {
                      if (confirmJoinRunId !== selected.runId) {
                        setConfirmJoinRunId(selected.runId);
                        return;
                      }

                      void (async () => {
                        const joinedTournament = await joinTournament(selected.runId);
                        if (!joinedTournament?.membership.isJoined) {
                          return;
                        }

                        setConfirmJoinRunId(null);
                        router.push(
                          {
                            pathname: '/tournaments/[runId]',
                            params: {
                              runId: selected.runId,
                            },
                          } as never,
                        );
                      })();
                    }}
                    onLaunch={(selected) => {
                      setConfirmJoinRunId(null);
                      void launchMatch(selected);
                    }}
                    onViewStandings={(selected) => {
                      setConfirmJoinRunId(null);
                      router.push(
                        {
                          pathname: '/tournaments/[runId]',
                          params: {
                            runId: selected.runId,
                          },
                        } as never,
                      );
                    }}
                  />
                ))}
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
    backgroundColor: 'rgba(56, 30, 13, 0.08)',
  },
  scrollContent: {
    alignItems: 'center',
  },
  stage: {
    width: '100%',
    alignItems: 'center',
    gap: urTheme.spacing.md,
  },
  topBar: {
    width: '100%',
    alignItems: 'flex-start',
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  pageEyebrow: {
    color: '#7A571F',
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  pageTitle: {
    color: '#22160C',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 244, 221, 0.32)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  pageTitleDesktop: {
    fontSize: 36,
    lineHeight: 40,
  },
  pageTitleCompact: {
    fontSize: 29,
    lineHeight: 33,
  },
  pageSubtitle: {
    maxWidth: 760,
    color: 'rgba(34, 22, 12, 0.88)',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  errorBanner: {
    width: '100%',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(143, 52, 41, 0.22)',
    backgroundColor: 'rgba(255, 235, 226, 0.76)',
  },
  errorBannerText: {
    color: '#8F3429',
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
    borderColor: 'rgba(126, 93, 42, 0.18)',
    backgroundColor: 'rgba(255, 248, 232, 0.5)',
  },
  stateTitle: {
    color: '#3B2412',
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center',
  },
  stateText: {
    color: 'rgba(73, 48, 26, 0.88)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 620,
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
});
