import { TournamentCard } from '@/components/tournaments/TournamentCard';
import { Button } from '@/components/ui/Button';
import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH, WideScreenBackground } from '@/components/ui/WideScreenBackground';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { useTournamentList } from '@/src/tournaments/useTournamentList';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const multiplayerWideBackground = require('../../../assets/images/multiplayer_bg.png');
const multiplayerMobileBackground = require('../../../assets/images/multiplayer_bg_mobile.png');

export default function PublicTournamentBrowseScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const showWideBackground = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH;
  const showMobileBackground = useMobileBackground();
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
    <View style={styles.screen}>
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
      <View pointerEvents="none" style={[styles.pageTexture, showWideBackground && styles.pageTextureWide]}>
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
        <View style={styles.hero}>
          <Text style={styles.pageTitle}>Public Tournaments</Text>
          <Text style={styles.pageSubtitle}>
            Browse every open tournament run, inspect the full standings before you enter, and jump into tournament play when your seat is ready.
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>Loading tournaments...</Text>
            <Text style={styles.emptyText}>Summoning the latest public runs from the royal archive.</Text>
          </View>
        ) : tournaments.length === 0 ? (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>No tournaments are open right now</Text>
            <Text style={styles.emptyText}>Check back soon for the next public run.</Text>
            <Button title="Return to Lobby" variant="outline" onPress={() => router.replace('/(game)/lobby?mode=online')} />
          </View>
        ) : (
          <View style={styles.cardList}>
            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.runId}
                tournament={tournament}
                joining={joiningRunId === tournament.runId}
                launching={launchingRunId === tournament.runId}
                onJoin={(selected) => {
                  void joinTournament(selected.runId);
                }}
                onLaunch={(selected) => {
                  void launchMatch(selected);
                }}
                onViewStandings={(selected) => {
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: urTheme.colors.night,
  },
  scrollView: {
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.xl,
  },
  hero: {
    width: '100%',
    maxWidth: 1080,
    alignItems: 'center',
    marginBottom: urTheme.spacing.lg,
  },
  pageTitle: {
    ...urTypography.title,
    color: urTheme.colors.parchment,
    fontSize: 38,
    lineHeight: 42,
    textAlign: 'center',
  },
  pageSubtitle: {
    color: 'rgba(238, 223, 197, 0.86)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 720,
    marginTop: urTheme.spacing.xs,
  },
  pageTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
  },
  pageTextureWide: {
    opacity: 0.12,
  },
  textureFill: {
    ...StyleSheet.absoluteFillObject,
  },
  pageGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(90, 132, 177, 0.18)',
  },
  pageShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
    backgroundColor: 'rgba(7, 11, 16, 0.24)',
  },
  cardList: {
    width: '100%',
    maxWidth: 1080,
    gap: urTheme.spacing.md,
  },
  errorBanner: {
    width: '100%',
    maxWidth: 1080,
    marginBottom: urTheme.spacing.md,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(246, 170, 162, 0.4)',
    backgroundColor: 'rgba(80, 22, 18, 0.54)',
  },
  errorBannerText: {
    ...urTypography.label,
    color: '#F6AAA2',
    fontSize: 11,
    textAlign: 'center',
  },
  emptyPanel: {
    width: '100%',
    maxWidth: 680,
    alignItems: 'center',
    gap: urTheme.spacing.sm,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1.4,
    borderColor: 'rgba(217, 164, 65, 0.74)',
    padding: urTheme.spacing.xl,
    backgroundColor: 'rgba(13, 15, 18, 0.64)',
    ...boxShadow({
      color: '#000',
      opacity: 0.28,
      offset: { width: 0, height: 10 },
      blurRadius: 14,
      elevation: 9,
    }),
  },
  emptyTitle: {
    ...urTypography.title,
    color: urTheme.colors.parchment,
    fontSize: 28,
    textAlign: 'center',
  },
  emptyText: {
    color: 'rgba(238, 223, 197, 0.82)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: urTheme.spacing.sm,
  },
});
