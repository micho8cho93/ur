import { Button } from '@/components/ui/Button';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import {
  buildTournamentBotSummary,
  buildTournamentPrizeSummary,
  formatTournamentDateTime,
  getTournamentCardPrimaryState,
  getTournamentChipState,
  getTournamentLobbyCountdownLabel,
  getTournamentLobbyCountdownMs,
  getTournamentModeLabel,
} from '@/src/tournaments/presentation';
import type { PublicTournamentSummary } from '@/src/tournaments/types';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

type TournamentCardProps = {
  tournament: PublicTournamentSummary;
  joining?: boolean;
  launching?: boolean;
  primaryTitle?: string;
  onJoin: (tournament: PublicTournamentSummary) => void;
  onLaunch: (tournament: PublicTournamentSummary) => void;
  onViewStandings: (tournament: PublicTournamentSummary) => void;
};

const chipToneStyles = {
  neutral: {
    backgroundColor: 'rgba(247, 229, 203, 0.1)',
    borderColor: 'rgba(247, 229, 203, 0.22)',
    color: urTheme.colors.parchment,
  },
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
} as const;

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  joining = false,
  launching = false,
  primaryTitle,
  onJoin,
  onLaunch,
  onViewStandings,
}) => {
  const [now, setNow] = useState(() => Date.now());
  const chip = getTournamentChipState(tournament);
  const primary = getTournamentCardPrimaryState(tournament);
  const resolvedPrimaryTitle = primaryTitle ?? primary.label;
  const lobbyCountdownMs = getTournamentLobbyCountdownMs(tournament, now);
  const lobbyCountdownLabel = getTournamentLobbyCountdownLabel(tournament, now);
  const shouldTickCountdown = lobbyCountdownMs !== null && lobbyCountdownMs > 0;
  const botSummary = buildTournamentBotSummary(tournament);
  const countdownLabelTitle = tournament.bots.autoAdd ? 'Bot Fill Starts In' : 'Lobby Autofinalizes In';

  useEffect(() => {
    setNow(Date.now());

    if (!shouldTickCountdown) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [shouldTickCountdown, tournament.lobbyDeadlineAt]);

  return (
    <View style={styles.card}>
      <View pointerEvents="none" style={styles.cardTexture}>
        <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.textureFill} />
      </View>
      <View pointerEvents="none" style={styles.cardBorder} />

      <View style={styles.headerRow}>
        <Text style={styles.title}>{tournament.name}</Text>
        <View
          style={[
            styles.chip,
            { backgroundColor: chipToneStyles[chip.tone].backgroundColor, borderColor: chipToneStyles[chip.tone].borderColor },
          ]}
        >
          <Text style={[styles.chipText, { color: chipToneStyles[chip.tone].color }]}>{chip.label}</Text>
        </View>
      </View>

      <Text numberOfLines={3} style={styles.description}>
        {tournament.description}
      </Text>

      <View style={styles.metaGrid}>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Start</Text>
          <Text style={styles.metaValue}>{formatTournamentDateTime(tournament.startAt)}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Entrants</Text>
          <Text style={styles.metaValue}>
            {tournament.entrants}/{tournament.maxEntrants}
          </Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Mode</Text>
          <Text style={styles.metaValue}>{getTournamentModeLabel(tournament.gameMode)}</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>Region</Text>
          <Text style={styles.metaValue}>{tournament.region}</Text>
        </View>
      </View>

      <Text style={styles.prizeSummary}>{buildTournamentPrizeSummary(tournament)}</Text>
      <Text style={styles.botSummary}>{botSummary}</Text>

      {lobbyCountdownLabel ? (
        <View style={styles.countdownPanel}>
          <Text style={styles.countdownLabel}>{countdownLabelTitle}</Text>
          <Text style={styles.countdownValue}>{lobbyCountdownLabel}</Text>
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        <Button
          title="View Standings"
          variant="outline"
          style={styles.secondaryButton}
          onPress={() => onViewStandings(tournament)}
        />
        <Button
          title={resolvedPrimaryTitle}
          loading={primary.loading || joining || launching}
          disabled={primary.disabled || joining || launching}
          style={styles.primaryButton}
          onPress={() => {
            if (primary.intent === 'join') {
              onJoin(tournament);
              return;
            }

            if (primary.intent === 'play') {
              onLaunch(tournament);
            }
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
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
  cardTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
  },
  textureFill: {
    ...StyleSheet.absoluteFillObject,
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 231, 192, 0.25)',
  },
  headerRow: {
    gap: urTheme.spacing.sm,
    marginBottom: urTheme.spacing.sm,
  },
  title: {
    ...urTypography.title,
    color: urTheme.colors.parchment,
    fontSize: 28,
    lineHeight: 32,
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: urTheme.spacing.sm + 2,
    paddingVertical: 6,
  },
  chipText: {
    ...urTypography.label,
    fontSize: 10,
  },
  description: {
    color: 'rgba(238, 223, 197, 0.85)',
    lineHeight: 21,
    marginBottom: urTheme.spacing.md,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: urTheme.spacing.sm,
    marginBottom: urTheme.spacing.md,
  },
  metaCell: {
    minWidth: 120,
    flexGrow: 1,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(247, 229, 203, 0.12)',
    backgroundColor: 'rgba(247, 229, 203, 0.05)',
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: urTheme.spacing.sm,
  },
  metaLabel: {
    ...urTypography.label,
    color: 'rgba(216, 232, 251, 0.72)',
    fontSize: 10,
    marginBottom: 4,
  },
  metaValue: {
    color: urTheme.colors.shell,
    fontSize: 13,
    lineHeight: 18,
  },
  prizeSummary: {
    color: 'rgba(246, 214, 151, 0.92)',
    marginBottom: urTheme.spacing.sm,
  },
  botSummary: {
    color: 'rgba(216, 232, 251, 0.82)',
    marginBottom: urTheme.spacing.md,
  },
  countdownPanel: {
    marginBottom: urTheme.spacing.md,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(240, 192, 64, 0.36)',
    backgroundColor: 'rgba(150, 89, 26, 0.16)',
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: urTheme.spacing.sm,
    gap: 4,
  },
  countdownLabel: {
    ...urTypography.label,
    color: '#F6DEAF',
    fontSize: 10,
  },
  countdownValue: {
    color: urTheme.colors.parchment,
    fontSize: 24,
    lineHeight: 28,
    fontFamily: urTypography.title.fontFamily,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: urTheme.spacing.sm,
  },
  secondaryButton: {
    flex: 1,
  },
  primaryButton: {
    flex: 1,
  },
});
