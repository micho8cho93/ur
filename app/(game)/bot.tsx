import { XpRewardBadge } from '@/components/progression/XpRewardBadge';
import { Button } from '@/components/ui/Button';
import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH, WideScreenBackground } from '@/components/ui/WideScreenBackground';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { BotDifficulty } from '@/logic/bot/types';
import { GAME_MODE_SCREEN_NOTE, getMatchConfig } from '@/logic/matchConfigs';
import { getXpAwardAmount } from '@/shared/progression';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, Platform, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle, useWindowDimensions } from 'react-native';

const botWideBackground = require('../../assets/images/bot_bg.png');
const botMobileBackground = require('../../assets/images/bot_bg_mobile.png');

type BotLevelCard = {
  difficulty: BotDifficulty;
  title: string;
  tagline: string;
  description: string;
  accent: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const BOT_LEVELS: BotLevelCard[] = [
  {
    difficulty: 'easy',
    title: 'Easy',
    tagline: 'Current bot',
    description: 'Plays a random legal move. Good for learning the board and testing lines.',
    accent: '#9E6D38',
    icon: 'wb-sunny',
  },
  {
    difficulty: 'medium',
    title: 'Medium',
    tagline: 'Tactical bot',
    description: 'Looks for captures, rosettes, safer landings, and better short-term progress.',
    accent: '#2B7A78',
    icon: 'flare',
  },
  {
    difficulty: 'hard',
    title: 'Hard',
    tagline: 'Lookahead bot',
    description: 'Searches future rolls and replies to choose stronger long-form plans.',
    accent: '#2E6FD8',
    icon: 'psychology',
  },
  {
    difficulty: 'perfect',
    title: 'Perfect',
    tagline: 'Deepest local search',
    description: 'Uses the strongest solver-style search available in this app for the sharpest local play.',
    accent: '#C8981E',
    icon: 'auto-awesome',
  },
];

export default function BotSelection() {
  const { width } = useWindowDimensions();
  const { modeId: rawModeId } = useLocalSearchParams<{ modeId?: string | string[] }>();
  const { startBotGame } = useMatchmaking('bot');
  const [pendingDifficulty, setPendingDifficulty] = React.useState<BotDifficulty | null>(null);
  const isCompactLayout = width < 820;
  const showWideBackground = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH;
  const showMobileBackground = useMobileBackground();
  const showInlineHeaderEyebrow = Platform.OS !== 'web';
  const resolvedModeId = Array.isArray(rawModeId) ? rawModeId[0] : rawModeId;
  const matchConfig = React.useMemo(() => getMatchConfig(resolvedModeId), [resolvedModeId]);
  const isPracticeMode = matchConfig.isPracticeMode;
  const headerTitle = isPracticeMode ? 'Game Modes' : 'Local Match';
  const winRewardXp = getXpAwardAmount(matchConfig.offlineWinRewardSource);

  const handleSelect = (difficulty: BotDifficulty) => {
    setPendingDifficulty(difficulty);
    startBotGame(difficulty, matchConfig);
  };

  const renderBotCard = (level: BotLevelCard, cardStyle: StyleProp<ViewStyle>) => {
    const isPending = pendingDifficulty === level.difficulty;

    return (
      <View key={level.difficulty} style={[styles.card, cardStyle, { borderColor: `${level.accent}C8` }]}>
        <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.cardTexture} />
        <View style={styles.cardBorder} />
        <XpRewardBadge amount={winRewardXp} style={styles.rewardBadge} />

        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: `${level.accent}26`, borderColor: `${level.accent}88` }]}>
            <MaterialIcons name={level.icon} size={20} color={level.accent} />
          </View>
          <View style={styles.copyColumn}>
            <Text style={styles.cardTitle}>{level.title}</Text>
            <Text style={styles.cardTagline}>{level.tagline}</Text>
          </View>
        </View>

        <Text style={styles.cardDescription}>{level.description}</Text>
        <Button
          title={isPending ? 'Preparing...' : `Play ${level.title}`}
          disabled={pendingDifficulty !== null}
          loading={isPending}
          onPress={() => handleSelect(level.difficulty)}
        />
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: headerTitle }} />
      <WideScreenBackground
        source={botWideBackground}
        visible={showWideBackground}
        overlayColor="rgba(8, 10, 15, 0.22)"
      />
      <MobileBackground
        source={botMobileBackground}
        visible={showMobileBackground}
        overlayColor="rgba(8, 10, 15, 0.22)"
      />
      <Image
        source={urTextures.woodDark}
        resizeMode="repeat"
        style={[styles.texture, showWideBackground && styles.textureWide]}
      />
      <View style={styles.topGlow} />
      <View style={styles.bottomShade} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        horizontal={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {showInlineHeaderEyebrow ? <Text style={styles.eyebrow}>{headerTitle}</Text> : null}
          <Text style={styles.title}>
            {isPracticeMode ? `${matchConfig.displayName} Difficulty` : 'Choose The Court You Want To Face'}
          </Text>
          <Text style={styles.subtitle}>
            {isPracticeMode
              ? `${matchConfig.selectionSubtitle}. Choose a bot difficulty for this offline practice match.`
              : 'Stronger Ur bots come from better state evaluation and deeper lookahead. Pick your opponent and enter the board.'}
          </Text>
          {isPracticeMode ? (
            <View style={styles.practicePill}>
              <Text style={styles.practicePillText}>{GAME_MODE_SCREEN_NOTE}</Text>
            </View>
          ) : null}
        </View>

        {isCompactLayout ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.compactCardRow}
          >
            {BOT_LEVELS.map((level) => renderBotCard(level, styles.compactCard))}
          </ScrollView>
        ) : (
          <View style={styles.gridList}>
            {BOT_LEVELS.map((level) => renderBotCard(level, styles.gridCard))}
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
  scrollContent: {
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.lg,
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
  },
  textureWide: {
    opacity: 0.12,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '34%',
    backgroundColor: 'rgba(180, 120, 30, 0.14)',
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '48%',
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
  },
  hero: {
    alignItems: 'center',
    marginBottom: urTheme.spacing.lg,
    paddingTop: urTheme.spacing.md,
  },
  eyebrow: {
    ...urTypography.label,
    color: urTheme.colors.parchment,
    fontSize: 11,
    marginBottom: urTheme.spacing.xs,
  },
  title: {
    ...urTypography.title,
    color: urTheme.colors.ivory,
    textAlign: 'center',
    fontSize: 34,
    lineHeight: 40,
    maxWidth: 520,
  },
  subtitle: {
    marginTop: urTheme.spacing.sm,
    color: 'rgba(239, 224, 198, 0.84)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 560,
  },
  practicePill: {
    marginTop: urTheme.spacing.md,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.54)',
    backgroundColor: 'rgba(13, 15, 18, 0.58)',
    maxWidth: 620,
  },
  practicePillText: {
    ...urTypography.label,
    color: urTheme.colors.parchment,
    fontSize: 11,
    textAlign: 'center',
  },
  compactCardRow: {
    gap: urTheme.spacing.md,
    paddingRight: urTheme.spacing.md,
  },
  gridList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: urTheme.spacing.md,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  card: {
    overflow: 'hidden',
    borderRadius: urTheme.radii.lg,
    borderWidth: 1.3,
    backgroundColor: 'rgba(13, 15, 18, 0.66)',
    padding: urTheme.spacing.lg,
    ...boxShadow({
      color: '#000',
      opacity: 0.24,
      offset: { width: 0, height: 10 },
      blurRadius: 14,
      elevation: 8,
    }),
  },
  compactCard: {
    width: 292,
    minHeight: 248,
  },
  gridCard: {
    width: '48.5%',
    minHeight: 252,
  },
  cardTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.14,
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 230, 181, 0.22)',
  },
  rewardBadge: {
    marginBottom: urTheme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: urTheme.spacing.sm,
    marginBottom: urTheme.spacing.sm,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  copyColumn: {
    flex: 1,
  },
  cardTitle: {
    ...urTypography.title,
    color: urTheme.colors.ivory,
    fontSize: 24,
    lineHeight: 28,
  },
  cardTagline: {
    ...urTypography.label,
    color: 'rgba(230, 209, 173, 0.86)',
    fontSize: 10,
    marginTop: 2,
  },
  cardDescription: {
    color: 'rgba(239, 224, 198, 0.84)',
    lineHeight: 21,
    marginBottom: urTheme.spacing.md,
  },
});
