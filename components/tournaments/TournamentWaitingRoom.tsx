import { TournamentStandingsTable } from '@/components/tournaments/TournamentStandingsTable';
import { Button } from '@/components/ui/Button';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import type { TournamentAdvanceFlowPhase } from '@/src/tournaments/useTournamentAdvanceFlow';
import type { PublicTournamentStanding } from '@/src/tournaments/types';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

type TournamentWaitingRoomProps = {
  visible: boolean;
  phase: TournamentAdvanceFlowPhase;
  tournamentName: string;
  derivedRound: number | null;
  statusText: string;
  subtleStatusText: string | null;
  retryMessage: string | null;
  standings: PublicTournamentStanding[];
  currentStanding: PublicTournamentStanding | null;
  highlightOwnerId: string | null;
  finalPlacement: number | null;
  isChampion: boolean;
  onBackToStandings: () => void;
  onReturnToMainPage: () => void;
  children?: React.ReactNode;
};

const buildTitle = (phase: TournamentAdvanceFlowPhase, isChampion: boolean): string => {
  if (phase === 'finalized') {
    return isChampion ? 'Champion Crowned' : 'Tournament Complete';
  }

  if (phase === 'eliminated') {
    return 'Tournament Run Ended';
  }

  return 'Victory Secured';
};

const buildBodyCopy = (
  phase: TournamentAdvanceFlowPhase,
  isChampion: boolean,
  finalPlacement: number | null,
): string => {
  if (phase === 'finalized') {
    if (isChampion) {
      return 'The bracket is settled and your run finished at the top. Your rewards stay visible below while the final standings lock in.';
    }

    if (typeof finalPlacement === 'number') {
      return `The tournament has concluded. Your final placement is rank ${finalPlacement}.`;
    }

    return 'The tournament has concluded and the final standings are now locked.';
  }

  if (phase === 'eliminated') {
    return 'Your tournament run is complete. The latest standings stay visible here while you review the result.';
  }

  return 'Stay here while the next round forms. Standings remain live and your post-match rewards stay visible during the intermission.';
};

export const TournamentWaitingRoom: React.FC<TournamentWaitingRoomProps> = ({
  visible,
  phase,
  tournamentName,
  derivedRound,
  statusText,
  subtleStatusText,
  retryMessage,
  standings,
  currentStanding,
  highlightOwnerId,
  finalPlacement,
  isChampion,
  onBackToStandings,
  children,
  onReturnToMainPage,
}) => {
  const cueOpacity = useRef(new Animated.Value(phase === 'ready' || phase === 'launching' ? 1 : 0)).current;
  const cueScale = useRef(new Animated.Value(phase === 'ready' || phase === 'launching' ? 1 : 0.98)).current;
  const cueGlow = useRef(new Animated.Value(phase === 'ready' || phase === 'launching' ? 1 : 0)).current;
  const showExitActions = phase === 'eliminated' || phase === 'finalized';

  useEffect(() => {
    const activeCue = phase === 'ready' || phase === 'launching';

    if (activeCue) {
      cueOpacity.setValue(0.45);
      cueScale.setValue(0.985);
      cueGlow.setValue(0.2);

      Animated.parallel([
        Animated.timing(cueOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(cueScale, {
          toValue: 1,
          friction: 8,
          tension: 110,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(cueGlow, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(cueGlow, {
            toValue: 0.42,
            duration: 420,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      return;
    }

    Animated.parallel([
      Animated.timing(cueOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(cueScale, {
        toValue: 0.98,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(cueGlow, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cueGlow, cueOpacity, cueScale, phase]);

  if (!visible) {
    return null;
  }

  return (
    <View testID="tournament-waiting-room" style={styles.backdrop}>
      <Animated.View
        style={[
          styles.cueGlow,
          {
            opacity: cueGlow,
            transform: [{ scale: cueScale }],
          },
        ]}
      />
      <View style={styles.sheet}>
        <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.texture} />
        <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.inlayTexture} />
        <View style={styles.border} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.headerBlock}>
            <Text style={styles.eyebrow}>Tournament Advance</Text>
            <Text style={styles.title}>{buildTitle(phase, isChampion)}</Text>
            <Text numberOfLines={2} style={styles.tournamentName}>
              {tournamentName}
            </Text>
            <Text style={styles.bodyCopy}>{buildBodyCopy(phase, isChampion, finalPlacement)}</Text>
          </View>

          <Animated.View
            style={[
              styles.statusCard,
              {
                opacity: cueOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
                transform: [{ scale: cueScale }],
              },
              (phase === 'ready' || phase === 'launching') && styles.statusCardReady,
            ]}
          >
            <View style={styles.statusHeader}>
              {typeof derivedRound === 'number' ? (
                <View style={styles.roundPill}>
                  <Text style={styles.roundPillText}>Round {derivedRound}</Text>
                </View>
              ) : null}
              {typeof currentStanding?.rank === 'number' ? (
                <View style={styles.rankPill}>
                  <Text style={styles.rankPillText}>Your Rank #{currentStanding.rank}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.statusText}>{statusText}</Text>
            {subtleStatusText ? <Text style={styles.subtleStatusText}>{subtleStatusText}</Text> : null}
            {retryMessage ? <Text style={styles.retryText}>{retryMessage}</Text> : null}
            {phase === 'finalized' && typeof finalPlacement === 'number' ? (
              <Text style={styles.finalPlacementText}>
                {isChampion ? 'Final placement: Champion' : `Final placement: #${finalPlacement}`}
              </Text>
            ) : null}
          </Animated.View>

          {children ? <View style={styles.summaryWrap}>{children}</View> : null}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live Standings</Text>
            <Text style={styles.sectionSubtitle}>Top of the board, with your latest public rank highlighted.</Text>
          </View>

          <TournamentStandingsTable
            entries={standings}
            emptyMessage="Tournament standings will appear here as soon as the run publishes them."
            highlightOwnerId={highlightOwnerId}
            presentation="preview"
          />

          <View style={styles.buttonStack}>
            <Button title="Back to Standings" variant="outline" onPress={onBackToStandings} />
            {showExitActions ? <Button title="Return to Main Page" onPress={onReturnToMainPage} /> : null}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: 'rgba(4, 8, 14, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: urTheme.spacing.md,
  },
  cueGlow: {
    position: 'absolute',
    width: '84%',
    maxWidth: 760,
    height: '78%',
    maxHeight: 720,
    borderRadius: 32,
    backgroundColor: 'rgba(96, 154, 240, 0.12)',
  },
  sheet: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '92%',
    borderRadius: urTheme.radii.lg,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(216, 232, 251, 0.24)',
    backgroundColor: 'rgba(8, 14, 24, 0.96)',
    ...boxShadow({
      color: '#000',
      opacity: 0.32,
      offset: { width: 0, height: 14 },
      blurRadius: 20,
      elevation: 14,
    }),
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  inlayTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 232, 192, 0.16)',
  },
  content: {
    padding: urTheme.spacing.lg,
    gap: urTheme.spacing.md,
  },
  headerBlock: {
    gap: urTheme.spacing.xs,
  },
  eyebrow: {
    ...urTypography.label,
    color: '#D9ECFF',
    fontSize: 11,
  },
  title: {
    ...urTypography.title,
    color: '#F8ECD6',
    fontSize: 30,
    lineHeight: 36,
  },
  tournamentName: {
    ...urTypography.subtitle,
    color: '#F0C965',
    fontSize: 18,
    lineHeight: 24,
  },
  bodyCopy: {
    color: 'rgba(236, 229, 214, 0.82)',
    fontSize: 14,
    lineHeight: 20,
  },
  statusCard: {
    borderRadius: urTheme.radii.lg,
    padding: urTheme.spacing.md,
    gap: urTheme.spacing.xs,
    backgroundColor: 'rgba(14, 23, 37, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(163, 205, 255, 0.22)',
  },
  statusCardReady: {
    borderColor: 'rgba(240, 201, 101, 0.36)',
    backgroundColor: 'rgba(19, 31, 49, 0.92)',
  },
  statusHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: urTheme.spacing.xs,
    marginBottom: urTheme.spacing.xs,
  },
  roundPill: {
    borderRadius: urTheme.radii.pill,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: 5,
    backgroundColor: 'rgba(70, 120, 194, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(163, 205, 255, 0.24)',
  },
  roundPillText: {
    ...urTypography.label,
    color: '#DAECFF',
    fontSize: 10,
  },
  rankPill: {
    borderRadius: urTheme.radii.pill,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: 5,
    backgroundColor: 'rgba(166, 112, 24, 0.26)',
    borderWidth: 1,
    borderColor: 'rgba(247, 220, 161, 0.24)',
  },
  rankPillText: {
    ...urTypography.label,
    color: '#F9E6BC',
    fontSize: 10,
  },
  statusText: {
    ...urTypography.subtitle,
    color: '#F8ECD6',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  subtleStatusText: {
    color: 'rgba(216, 232, 251, 0.82)',
    fontSize: 13,
    lineHeight: 18,
  },
  retryText: {
    color: 'rgba(247, 220, 161, 0.88)',
    fontSize: 12,
    lineHeight: 17,
  },
  finalPlacementText: {
    ...urTypography.label,
    color: '#F0C965',
    fontSize: 11,
    marginTop: urTheme.spacing.xs,
  },
  summaryWrap: {
    gap: urTheme.spacing.sm,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    ...urTypography.subtitle,
    color: '#F8ECD6',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: 'rgba(216, 232, 251, 0.74)',
    fontSize: 12,
    lineHeight: 17,
  },
  buttonStack: {
    gap: urTheme.spacing.sm,
  },
});
