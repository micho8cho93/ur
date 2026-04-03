import { HomeActionButton } from '@/components/home/HomeActionButton';
import {
  urPanelColors,
  urTextColors,
  urTextVariants,
} from '@/constants/urTheme';
import {
  resolveHomeFredokaFontFamily,
  resolveHomeMagicFontFamily,
} from '@/src/home/homeTheme';
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
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

type TournamentCardProps = {
  tournament: PublicTournamentSummary;
  joining?: boolean;
  launching?: boolean;
  primaryTitle?: string;
  fontLoaded?: boolean;
  onJoin: (tournament: PublicTournamentSummary) => void;
  onLaunch: (tournament: PublicTournamentSummary) => void;
  onViewStandings: (tournament: PublicTournamentSummary) => void;
};

const chipToneStyles = {
  neutral: {
    backgroundColor: 'rgba(255, 239, 196, 0.68)',
    borderColor: 'rgba(184, 134, 11, 0.24)',
    color: '#6A4822',
  },
  info: {
    backgroundColor: 'rgba(45, 156, 219, 0.16)',
    borderColor: 'rgba(45, 156, 219, 0.26)',
    color: '#1E5E84',
  },
  success: {
    backgroundColor: 'rgba(127, 191, 62, 0.16)',
    borderColor: 'rgba(127, 191, 62, 0.26)',
    color: '#486A21',
  },
  warning: {
    backgroundColor: 'rgba(244, 197, 66, 0.18)',
    borderColor: 'rgba(184, 134, 11, 0.26)',
    color: '#7A4E16',
  },
} as const;

const tournamentPanelArt = require('../../assets/images/tournament_large_panel_cropped.png');

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  joining = false,
  launching = false,
  primaryTitle,
  fontLoaded = false,
  onJoin,
  onLaunch,
  onViewStandings,
}) => {
  const { width } = useWindowDimensions();
  const [now, setNow] = useState(() => Date.now());
  const chip = getTournamentChipState(tournament);
  const primary = getTournamentCardPrimaryState(tournament);
  const resolvedPrimaryTitle = primaryTitle ?? primary.label;
  const lobbyCountdownMs = getTournamentLobbyCountdownMs(tournament, now);
  const lobbyCountdownLabel = getTournamentLobbyCountdownLabel(tournament, now);
  const shouldTickCountdown = lobbyCountdownMs !== null && lobbyCountdownMs > 0;
  const botSummary = buildTournamentBotSummary(tournament);
  const countdownLabelTitle = tournament.bots.autoAdd ? 'Bot Fill Starts In' : 'Lobby Autofinalizes In';
  const titleFontFamily = resolveHomeMagicFontFamily(fontLoaded);
  const bodyFontFamily = resolveHomeFredokaFontFamily(fontLoaded);
  const isCompact = width < 760;
  const useStackedButtons = width < 560;

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
    <View style={styles.cardShell}>
      <ImageBackground
        source={tournamentPanelArt}
        resizeMode="stretch"
        style={[styles.panel, isCompact ? styles.panelCompact : styles.panelDesktop]}
        imageStyle={styles.panelImage}
      >
        <View
          style={[
            styles.panelViewport,
            isCompact ? styles.panelViewportCompact : styles.panelViewportDesktop,
          ]}
        >
          <View style={styles.headerBlock}>
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: chipToneStyles[chip.tone].backgroundColor,
                  borderColor: chipToneStyles[chip.tone].borderColor,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: chipToneStyles[chip.tone].color, fontFamily: bodyFontFamily }]}>
                {chip.label}
              </Text>
            </View>

            <Text style={[styles.kicker, { fontFamily: bodyFontFamily }]}>Public Tournament</Text>

            <Text
              numberOfLines={isCompact ? 2 : 1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              style={[
                styles.title,
                isCompact ? styles.titleCompact : styles.titleDesktop,
                { fontFamily: titleFontFamily },
              ]}
            >
              {tournament.name}
            </Text>

            <Text
              numberOfLines={isCompact ? 3 : 2}
              style={[
                styles.description,
                isCompact ? styles.descriptionCompact : styles.descriptionDesktop,
                { fontFamily: bodyFontFamily },
              ]}
            >
              {tournament.description}
            </Text>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <Text style={[styles.metaLabel, { fontFamily: bodyFontFamily }]}>Start</Text>
              <Text style={[styles.metaValue, { fontFamily: bodyFontFamily }]}>
                {formatTournamentDateTime(tournament.startAt)}
              </Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={[styles.metaLabel, { fontFamily: bodyFontFamily }]}>Entrants</Text>
              <Text style={[styles.metaValue, { fontFamily: bodyFontFamily }]}>
                {tournament.entrants}/{tournament.maxEntrants}
              </Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={[styles.metaLabel, { fontFamily: bodyFontFamily }]}>Mode</Text>
              <Text style={[styles.metaValue, { fontFamily: bodyFontFamily }]}>
                {getTournamentModeLabel(tournament.gameMode)}
              </Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={[styles.metaLabel, { fontFamily: bodyFontFamily }]}>Region</Text>
              <Text style={[styles.metaValue, { fontFamily: bodyFontFamily }]}>
                {tournament.region}
              </Text>
            </View>
          </View>

          <View style={styles.summaryStack}>
            <Text
              numberOfLines={2}
              style={[styles.summaryLine, styles.summaryLineGold, { fontFamily: bodyFontFamily }]}
            >
              {buildTournamentPrizeSummary(tournament)}
            </Text>
            <Text numberOfLines={2} style={[styles.summaryLine, { fontFamily: bodyFontFamily }]}>
              {botSummary}
            </Text>
          </View>

          {lobbyCountdownLabel ? (
            <View style={styles.countdownPanel}>
              <Text style={[styles.countdownLabel, { fontFamily: bodyFontFamily }]}>
                {countdownLabelTitle}
              </Text>
              <Text style={[styles.countdownValue, { fontFamily: titleFontFamily }]}>
                {lobbyCountdownLabel}
              </Text>
            </View>
          ) : null}

          <View style={[styles.buttonRow, useStackedButtons && styles.buttonRowStacked]}>
            <View style={[styles.buttonSlot, useStackedButtons && styles.buttonSlotStacked]}>
              <HomeActionButton
                title="View Standings"
                tone="stone"
                size={isCompact ? 'small' : 'regular'}
                compact={isCompact}
                fontLoaded={fontLoaded}
                onPress={() => onViewStandings(tournament)}
              />
            </View>
            <View style={[styles.buttonSlot, useStackedButtons && styles.buttonSlotStacked]}>
              <HomeActionButton
                title={resolvedPrimaryTitle}
                tone="gold"
                size={isCompact ? 'small' : 'regular'}
                compact={isCompact}
                fontLoaded={fontLoaded}
                loading={primary.loading || joining || launching}
                disabled={primary.disabled || joining || launching}
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
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  cardShell: {
    width: '100%',
  },
  panel: {
    width: '100%',
    overflow: 'visible',
    justifyContent: 'center',
  },
  panelDesktop: {
    minHeight: 424,
  },
  panelCompact: {
    minHeight: 560,
  },
  panelImage: {
    width: '100%',
    height: '100%',
  },
  panelViewport: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelViewportDesktop: {
    top: '13%',
    right: '12%',
    bottom: '14%',
    left: '12%',
  },
  panelViewportCompact: {
    top: '12%',
    right: '11%',
    bottom: '12%',
    left: '11%',
  },
  headerBlock: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 14,
  },
  chip: {
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
  },
  kicker: {
    color: urTextColors.captionOnPanel,
    fontSize: 12,
    lineHeight: 15,
    ...urTextVariants.caption,
    textAlign: 'center',
    marginBottom: 6,
  },
  title: {
    color: urTextColors.titleOnPanel,
    textAlign: 'center',
    ...urTextVariants.cardTitle,
    width: '100%',
  },
  titleDesktop: {
    fontSize: 29,
    lineHeight: 31,
  },
  titleCompact: {
    fontSize: 24,
    lineHeight: 27,
  },
  description: {
    color: urTextColors.bodyOnPanel,
    textAlign: 'center',
    ...urTextVariants.body,
    maxWidth: 740,
  },
  descriptionDesktop: {
    fontSize: 14,
    lineHeight: 19,
    marginTop: 6,
  },
  descriptionCompact: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  metaGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  metaCell: {
    minWidth: 116,
    maxWidth: 168,
    flexGrow: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: urPanelColors.parchmentBorder,
    backgroundColor: urPanelColors.parchmentSurface,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  metaLabel: {
    color: urTextColors.captionOnPanel,
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
    ...urTextVariants.caption,
    marginBottom: 3,
  },
  metaValue: {
    color: urTextColors.bodyOnPanel,
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
    ...urTextVariants.body,
  },
  summaryStack: {
    width: '100%',
    gap: 4,
    marginBottom: 12,
  },
  summaryLine: {
    color: urTextColors.bodyOnPanel,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
    ...urTextVariants.body,
  },
  summaryLineGold: {
    color: urTextColors.captionOnPanel,
  },
  countdownPanel: {
    minWidth: 210,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: urPanelColors.parchmentBorder,
    backgroundColor: urPanelColors.parchmentSurfaceStrong,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  countdownLabel: {
    color: urTextColors.captionOnPanel,
    fontSize: 11,
    lineHeight: 13,
    textAlign: 'center',
    ...urTextVariants.caption,
  },
  countdownValue: {
    color: urTextColors.titleOnPanel,
    fontSize: 22,
    lineHeight: 24,
    textAlign: 'center',
    ...urTextVariants.cardTitle,
  },
  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  buttonRowStacked: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  buttonSlot: {
    flex: 1,
    maxWidth: 260,
  },
  buttonSlotStacked: {
    width: '100%',
    maxWidth: '100%',
  },
});
