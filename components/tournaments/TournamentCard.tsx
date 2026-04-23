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
  buildTournamentRewardSummary,
  formatTournamentDateTime,
  getTournamentCardPrimaryState,
  getTournamentJoinStatusLabel,
  getTournamentLobbyCountdownLabel,
  getTournamentLobbyCountdownMs,
  getTournamentModeLabel,
  shouldShowTournamentDescription,
} from '@/src/tournaments/presentation';
import type { PublicTournamentSummary } from '@/src/tournaments/types';
import React, { useEffect, useState } from 'react';
import {
  ImageBackground,
  ImageStyle,
  Platform,
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
  featured?: boolean;
  artScale?: number;
  onJoin: (tournament: PublicTournamentSummary) => void;
  onLaunch: (tournament: PublicTournamentSummary) => void;
  onViewStandings: (tournament: PublicTournamentSummary) => void;
};

const tournamentPanelArt = require('../../assets/images/card_landscape.png');
const tournamentFeaturedPanelArt = require('../../assets/images/featured_card_landscape.png');
const tournamentCardArt = require('../../assets/images/card_portrait.png');
const TOURNAMENT_CARD_ART_ASPECT_RATIO = 626 / 732;
const TOURNAMENT_FEATURED_CARD_ASPECT_RATIO = 1536 / 1024 / 1.3;
const TOURNAMENT_FEATURED_CARD_DENSE_ASPECT_RATIO = 1.95 / 1.3;

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  joining = false,
  launching = false,
  primaryTitle,
  fontLoaded = false,
  featured = false,
  artScale = 1,
  onJoin,
  onLaunch,
  onViewStandings,
}) => {
  const { width } = useWindowDimensions();
  const [now, setNow] = useState(() => Date.now());
  const primary = getTournamentCardPrimaryState(tournament);
  const resolvedPrimaryTitle = primaryTitle ?? primary.label;
  const lobbyCountdownMs = getTournamentLobbyCountdownMs(tournament, now);
  const lobbyCountdownLabel = getTournamentLobbyCountdownLabel(tournament, now);
  const shouldTickCountdown = lobbyCountdownMs !== null && lobbyCountdownMs > 0;
  const botSummary = buildTournamentBotSummary(tournament);
  const rewardSummary = buildTournamentRewardSummary(tournament);
  const joinStatusLabel = getTournamentJoinStatusLabel(tournament, now);
  const showDescription = shouldShowTournamentDescription(tournament.description);
  const countdownLabelTitle = tournament.bots.autoAdd ? 'Bot Fill Starts In' : 'Lobby Autofinalizes In';
  const titleFontFamily = resolveHomeMagicFontFamily(fontLoaded);
  const bodyFontFamily = resolveHomeFredokaFontFamily(fontLoaded);
  const isCompact = width < 760;
  const useStackedButtons = width < 560;
  const useMobileWebJoinCardArt = !featured && Platform.OS === 'web' && width < 760 && primary.intent === 'join';
  const useInlineCountdownRow = Boolean(lobbyCountdownLabel) && !useStackedButtons && !useMobileWebJoinCardArt;
  const panelImageStyle: ImageStyle[] = [
    styles.panelImage,
    artScale !== 1 ? { transform: [{ scale: artScale }] } : null,
  ].filter(Boolean) as ImageStyle[];
  const panelStyle = useMobileWebJoinCardArt
    ? styles.panelCard
    : featured
      ? isCompact
        ? styles.panelFeaturedCompact
        : styles.panelFeaturedDesktop
      : isCompact
        ? styles.panelCompact
        : styles.panelDesktop;
  const panelViewportStyle = useMobileWebJoinCardArt
    ? styles.panelViewportCard
    : isCompact
      ? styles.panelViewportCompact
      : styles.panelViewportDesktop;

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
        source={useMobileWebJoinCardArt ? tournamentCardArt : featured ? tournamentFeaturedPanelArt : tournamentPanelArt}
        resizeMode="stretch"
        style={[styles.panel, panelStyle]}
        imageStyle={panelImageStyle}
      >
        <View
          style={[styles.panelViewport, panelViewportStyle]}
        >
          <View style={styles.headerBlock}>
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

            {showDescription ? (
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
            ) : null}
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
              <Text style={[styles.metaLabel, { fontFamily: bodyFontFamily }]}>Status</Text>
              <Text style={[styles.metaValue, { fontFamily: bodyFontFamily }]}>
                {joinStatusLabel}
              </Text>
            </View>
          </View>

          <View style={styles.summaryStack}>
            <Text
              numberOfLines={2}
              style={[styles.summaryLine, styles.summaryLineGold, { fontFamily: bodyFontFamily }]}
            >
              {rewardSummary}
            </Text>
            <Text numberOfLines={2} style={[styles.summaryLine, { fontFamily: bodyFontFamily }]}>
              {botSummary}
            </Text>
          </View>

          {lobbyCountdownLabel && !useInlineCountdownRow ? (
            <View style={styles.countdownPanel}>
              <Text style={[styles.countdownLabel, { fontFamily: bodyFontFamily }]}>
                {countdownLabelTitle}
              </Text>
              <Text style={[styles.countdownValue, { fontFamily: titleFontFamily }]}>
                {lobbyCountdownLabel}
              </Text>
            </View>
          ) : null}

          {useInlineCountdownRow ? (
            <View style={styles.actionRow}>
              <View style={styles.actionButtonSlot}>
                <HomeActionButton
                  title="View Standings"
                  tone="gold"
                  size={isCompact ? 'small' : 'regular'}
                  compact={isCompact}
                  fontLoaded={fontLoaded}
                  onPress={() => onViewStandings(tournament)}
                />
              </View>
              <View style={styles.actionCountdownSlot}>
                <View style={[styles.countdownPanel, styles.countdownPanelInline]}>
                  <Text style={[styles.countdownLabel, { fontFamily: bodyFontFamily }]}>
                    {countdownLabelTitle}
                  </Text>
                  <Text style={[styles.countdownValue, { fontFamily: titleFontFamily }]}>
                    {lobbyCountdownLabel}
                  </Text>
                </View>
              </View>
              <View style={styles.actionButtonSlot}>
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
          ) : (
            <View style={[styles.buttonRow, useStackedButtons && styles.buttonRowStacked]}>
              <View style={[styles.buttonSlot, useStackedButtons && styles.buttonSlotStacked]}>
                <HomeActionButton
                  title="View Standings"
                  tone="gold"
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
          )}
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
  panelFeaturedDesktop: {
    aspectRatio: TOURNAMENT_FEATURED_CARD_ASPECT_RATIO,
  },
  panelFeaturedCompact: {
    aspectRatio: TOURNAMENT_FEATURED_CARD_DENSE_ASPECT_RATIO,
  },
  panelCard: {
    aspectRatio: TOURNAMENT_CARD_ART_ASPECT_RATIO,
    minHeight: 0,
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
  panelViewportCard: {
    top: '11.5%',
    right: '13%',
    bottom: '13%',
    left: '13%',
  },
  headerBlock: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 14,
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
  countdownPanelInline: {
    minWidth: 0,
    width: '100%',
    marginBottom: 0,
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
  actionRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 12,
  },
  actionButtonSlot: {
    flex: 1,
    maxWidth: 248,
    justifyContent: 'center',
  },
  actionCountdownSlot: {
    flexBasis: 210,
    maxWidth: 238,
    minWidth: 190,
    flexGrow: 1,
    justifyContent: 'center',
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
