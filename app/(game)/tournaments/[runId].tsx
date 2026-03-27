import { TournamentStandingsTable } from '@/components/tournaments/TournamentStandingsTable';
import { Button } from '@/components/ui/Button';
import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH, WideScreenBackground } from '@/components/ui/WideScreenBackground';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import {
  buildTournamentPrizeSummary,
  formatTournamentDateTime,
  getTournamentChipState,
  getTournamentDetailPrimaryState,
  getTournamentModeLabel,
} from '@/src/tournaments/presentation';
import { useTournamentDetail } from '@/src/tournaments/useTournamentDetail';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const multiplayerWideBackground = require('../../../assets/images/multiplayer_bg.png');
const multiplayerMobileBackground = require('../../../assets/images/multiplayer_bg_mobile.png');

const chipToneStyles = {
  info: {
    backgroundColor: 'rgba(58, 107, 174, 0.22)',
    borderColor: 'rgba(130, 182, 255, 0.42)',
    color: 'rgba(216, 232, 251, 0.96)',
  },
  success: {
    backgroundColor: 'rgba(64, 118, 76, 0.22)',
    borderColor: 'rgba(126, 208, 142, 0.44)',
    color: '#D9F7D8',
  },
  warning: {
    backgroundColor: 'rgba(150, 89, 26, 0.22)',
    borderColor: 'rgba(240, 192, 64, 0.42)',
    color: '#F6DEAF',
  },
  neutral: {
    backgroundColor: 'rgba(247, 229, 203, 0.1)',
    borderColor: 'rgba(247, 229, 203, 0.22)',
    color: urTheme.colors.parchment,
  },
} as const;

export default function TournamentDetailScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { runId: rawRunId } = useLocalSearchParams<{ runId?: string | string[] }>();
  const runId = useMemo(() => (Array.isArray(rawRunId) ? rawRunId[0] : rawRunId ?? null), [rawRunId]);
  const showWideBackground = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH;
  const showMobileBackground = useMobileBackground();
  const {
    tournament,
    standings,
    isLoading,
    isRefreshing,
    errorMessage,
    joiningRunId,
    launchingRunId,
    refresh,
    joinTournament,
    launchMatch,
  } = useTournamentDetail(runId);

  const chip = tournament ? getTournamentChipState(tournament) : null;
  const primary = tournament ? getTournamentDetailPrimaryState(tournament) : null;

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
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>Loading tournament...</Text>
            <Text style={styles.emptyText}>Drawing the latest standings into view.</Text>
          </View>
        ) : !tournament ? (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>Tournament not found</Text>
            <Text style={styles.emptyText}>This run is no longer visible in public play.</Text>
            <Button title="Back to Tournaments" variant="outline" onPress={() => router.replace('/tournaments' as never)} />
          </View>
        ) : (
          <>
            <View style={styles.heroPanel}>
              <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.heroTexture} />
              <View style={styles.heroBorder} />

              <View style={styles.heroHeader}>
                <View style={styles.heroTitleWrap}>
                  <Text style={styles.heroTitle}>{tournament.name}</Text>
                  <Text style={styles.heroDescription}>{tournament.description}</Text>
                </View>
                {chip ? (
                  <View
                    style={[
                      styles.heroChip,
                      {
                        backgroundColor: chipToneStyles[chip.tone].backgroundColor,
                        borderColor: chipToneStyles[chip.tone].borderColor,
                      },
                    ]}
                  >
                    <Text style={[styles.heroChipText, { color: chipToneStyles[chip.tone].color }]}>{chip.label}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.heroActionRow}>
                <Button
                  title={primary?.label ?? 'Join'}
                  loading={joiningRunId === tournament.runId || launchingRunId === tournament.runId}
                  disabled={primary?.disabled ?? false}
                  onPress={() => {
                    if (!primary || primary.intent === 'none') {
                      return;
                    }

                    if (primary.intent === 'join') {
                      void joinTournament();
                      return;
                    }

                    void launchMatch(tournament);
                  }}
                  style={styles.heroPrimaryButton}
                />
                <Button
                  title={isRefreshing ? 'Refreshing...' : 'Refresh'}
                  variant="outline"
                  style={styles.heroSecondaryButton}
                  onPress={() => {
                    void refresh();
                  }}
                />
              </View>

              {!tournament.membership.isJoined ? null : (
                <View style={styles.joinedBanner}>
                  <Text style={styles.joinedBannerTitle}>You are enrolled in this tournament.</Text>
                  <Text style={styles.joinedBannerText}>
                    {primary?.disabled
                      ? 'You can launch your tournament match as soon as the start time arrives.'
                      : 'You can launch a tournament match from this screen whenever you are ready.'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Entrants</Text>
                <Text style={styles.summaryValue}>
                  {tournament.entrants}/{tournament.maxEntrants}
                </Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Start Time</Text>
                <Text style={styles.summaryValue}>{formatTournamentDateTime(tournament.startAt)}</Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Mode</Text>
                <Text style={styles.summaryValue}>{getTournamentModeLabel(tournament.gameMode)}</Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Region</Text>
                <Text style={styles.summaryValue}>{tournament.region}</Text>
              </View>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryLabel}>Buy-in / Prize</Text>
                <Text style={styles.summaryValue}>{buildTournamentPrizeSummary(tournament)}</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Standings</Text>
              <Text style={styles.sectionSubtitle}>Full public leaderboard before you join.</Text>
            </View>

            <TournamentStandingsTable
              entries={standings}
              emptyMessage="No standings entries are available for this run yet."
            />
          </>
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
    gap: urTheme.spacing.md,
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
  errorBanner: {
    width: '100%',
    maxWidth: 1080,
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
  heroPanel: {
    width: '100%',
    maxWidth: 1080,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1.4,
    borderColor: 'rgba(217, 164, 65, 0.74)',
    padding: urTheme.spacing.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(13, 15, 18, 0.64)',
    ...boxShadow({
      color: '#000',
      opacity: 0.28,
      offset: { width: 0, height: 10 },
      blurRadius: 14,
      elevation: 9,
    }),
  },
  heroTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
  },
  heroBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 231, 192, 0.25)',
  },
  heroHeader: {
    gap: urTheme.spacing.sm,
    marginBottom: urTheme.spacing.md,
  },
  heroTitleWrap: {
    gap: urTheme.spacing.sm,
  },
  heroTitle: {
    ...urTypography.title,
    color: urTheme.colors.parchment,
    fontSize: 34,
    lineHeight: 38,
  },
  heroDescription: {
    color: 'rgba(238, 223, 197, 0.86)',
    lineHeight: 22,
  },
  heroChip: {
    alignSelf: 'flex-start',
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: urTheme.spacing.sm + 2,
    paddingVertical: 6,
  },
  heroChipText: {
    ...urTypography.label,
    fontSize: 10,
  },
  heroActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: urTheme.spacing.sm,
  },
  heroPrimaryButton: {
    minWidth: 220,
    flexGrow: 1,
  },
  heroSecondaryButton: {
    minWidth: 160,
  },
  joinedBanner: {
    marginTop: urTheme.spacing.md,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(126, 208, 142, 0.28)',
    backgroundColor: 'rgba(56, 92, 63, 0.22)',
    padding: urTheme.spacing.md,
  },
  joinedBannerTitle: {
    ...urTypography.label,
    color: '#D9F7D8',
    fontSize: 11,
    marginBottom: 6,
  },
  joinedBannerText: {
    color: 'rgba(234, 246, 235, 0.88)',
    lineHeight: 20,
  },
  summaryRow: {
    width: '100%',
    maxWidth: 1080,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: urTheme.spacing.sm,
  },
  summaryCell: {
    minWidth: 180,
    flexGrow: 1,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(247, 229, 203, 0.14)',
    backgroundColor: 'rgba(13, 15, 18, 0.42)',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm + 2,
  },
  summaryLabel: {
    ...urTypography.label,
    color: 'rgba(216, 232, 251, 0.74)',
    fontSize: 10,
    marginBottom: 6,
  },
  summaryValue: {
    color: urTheme.colors.shell,
    lineHeight: 20,
  },
  sectionHeader: {
    width: '100%',
    maxWidth: 1080,
    gap: 4,
  },
  sectionTitle: {
    ...urTypography.title,
    color: urTheme.colors.parchment,
    fontSize: 28,
  },
  sectionSubtitle: {
    color: 'rgba(238, 223, 197, 0.8)',
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
