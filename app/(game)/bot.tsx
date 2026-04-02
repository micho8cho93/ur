import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { SketchButton } from '@/components/ui/SketchButton';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH, WideScreenBackground } from '@/components/ui/WideScreenBackground';
import { urTheme } from '@/constants/urTheme';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { BotDifficulty } from '@/logic/bot/types';
import { GAME_MODE_SCREEN_NOTE, getMatchConfig } from '@/logic/matchConfigs';
import {
  HOME_FREDOKA_FONT_FAMILY,
  HOME_SUPERCELL_FONT_FAMILY,
  resolveHomeFredokaFontFamily,
  resolveHomeMagicFontFamily,
} from '@/src/home/homeTheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFonts } from 'expo-font';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ImageBackground, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const homeWideBackground = require('../../assets/images/home_bg.png');
const homeMobileBackground = require('../../assets/images/home_bg_mobile.png');
const quickPlayModePanel = require('../../assets/images/quick_play_mode_panel_cropped.png');

const MODE_PANEL_ART_ASPECT_RATIO = 1113 / 458;

type BotLevelCard = {
  difficulty: BotDifficulty;
  title: string;
  tagline: string;
  description: string;
  accent: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const BOT_LEVELS: readonly BotLevelCard[] = [
  {
    difficulty: 'easy',
    title: 'Easy',
    tagline: 'Current bot',
    description: 'Random legal moves with no planning. Best for learning the board and testing lines.',
    accent: '#9E6D38',
    icon: 'wb-sunny',
  },
  {
    difficulty: 'medium',
    title: 'Medium',
    tagline: 'Tactical bot',
    description: 'Values captures, rosettes, safer landings, and better short-term tempo.',
    accent: '#2B7A78',
    icon: 'flare',
  },
  {
    difficulty: 'hard',
    title: 'Hard',
    tagline: 'Lookahead bot',
    description: 'Searches future rolls and replies to build stronger long-form plans.',
    accent: '#2E6FD8',
    icon: 'psychology',
  },
  {
    difficulty: 'perfect',
    title: 'Perfect',
    tagline: 'Deepest local search',
    description: 'Uses the strongest local search in the app for the sharpest offline play.',
    accent: '#C8981E',
    icon: 'auto-awesome',
  },
] as const;

export default function BotSelection() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { modeId: rawModeId } = useLocalSearchParams<{ modeId?: string | string[] }>();
  const { startBotGame, startOfflineMatch } = useMatchmaking('bot');
  const [pendingDifficulty, setPendingDifficulty] = React.useState<BotDifficulty | null>(null);
  const [isPreparingLocalPvP, setIsPreparingLocalPvP] = React.useState(false);
  const [fontsLoaded] = useFonts({
    [HOME_FREDOKA_FONT_FAMILY]: require('../../assets/fonts/Fredoka-VariableFont_wdth,wght.ttf'),
    [HOME_SUPERCELL_FONT_FAMILY]: require('../../assets/fonts/Supercell-Magic-Regular.ttf'),
  });
  const showWideBackground = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH;
  const showMobileBackground = useMobileBackground();
  const isCompactLayout = width < 820;
  const isDesktopViewport = Platform.OS === 'web' && width >= 920;
  const isTightDesktopViewport = isDesktopViewport && height <= 820;
  const horizontalPadding = isDesktopViewport ? urTheme.spacing.lg : urTheme.spacing.md;
  const topPadding = insets.top + (isDesktopViewport ? 12 : 8);
  const bottomPadding = insets.bottom + (isCompactLayout ? urTheme.spacing.xl : urTheme.spacing.lg);
  const stageWidth = isDesktopViewport
    ? Math.min(width - horizontalPadding * 2, 940)
    : isCompactLayout
      ? Math.min(width - horizontalPadding * 2, 430)
      : Math.min(width - horizontalPadding * 2, 780);
  const titleFontFamily = resolveHomeMagicFontFamily(fontsLoaded);
  const bodyFontFamily = resolveHomeFredokaFontFamily(fontsLoaded);
  const resolvedModeId = Array.isArray(rawModeId) ? rawModeId[0] : rawModeId;
  const matchConfig = React.useMemo(() => getMatchConfig(resolvedModeId), [resolvedModeId]);
  const isPracticeMode = matchConfig.isPracticeMode;
  const isLocalPvPMode = matchConfig.opponentType === 'human';
  const heroTitle = isLocalPvPMode ? `${matchConfig.displayName} Local Match` : `${matchConfig.displayName} Difficulty`;
  const heroSubtitle = isLocalPvPMode
    ? `${matchConfig.selectionSubtitle}. Launch a same-device match where both sides are controlled locally.`
    : isPracticeMode
      ? `${matchConfig.selectionSubtitle}. Choose a bot difficulty for this offline practice match.`
      : 'Choose how sharp your local opponent should be, then jump straight into the board.';

  const handleSelect = (difficulty: BotDifficulty) => {
    setPendingDifficulty(difficulty);
    startBotGame(difficulty, matchConfig);
  };

  const handleStartLocalPvP = () => {
    setIsPreparingLocalPvP(true);
    void startOfflineMatch(matchConfig).finally(() => {
      setIsPreparingLocalPvP(false);
    });
  };

  const renderBotCard = (level: BotLevelCard) => {
    const isPending = pendingDifficulty === level.difficulty;

    return (
      <View
        key={level.difficulty}
        style={[
          styles.cardShell,
          isCompactLayout && styles.cardShellCompact,
          isDesktopViewport && styles.cardShellDesktop,
        ]}
      >
        <ImageBackground
          source={quickPlayModePanel}
          resizeMode="stretch"
          style={styles.cardPanel}
          imageStyle={styles.cardPanelImage}
        >
          <View style={[styles.cardPanelContent, isCompactLayout && styles.cardPanelContentCompact]}>
            <View style={styles.cardTitleGroup}>
              <View style={[styles.iconWrap, { borderColor: `${level.accent}40`, backgroundColor: `${level.accent}18` }]}>
                <MaterialIcons name={level.icon} size={18} color={level.accent} />
              </View>
              <Text style={[styles.cardTitle, { fontFamily: titleFontFamily }]}>{level.title}</Text>
            </View>
            <Text style={[styles.cardTagline, { fontFamily: bodyFontFamily }]}>{level.tagline}</Text>
            <Text
              numberOfLines={isCompactLayout ? 4 : 3}
              style={[styles.cardDescription, { fontFamily: bodyFontFamily }]}
            >
              {level.description}
            </Text>
          </View>
        </ImageBackground>

        <SketchButton
          label={isPending ? 'Preparing...' : `Play ${level.title}`}
          accessibilityLabel={isPending ? `Preparing ${level.title}` : `Play ${level.title}`}
          onPress={() => handleSelect(level.difficulty)}
          wide
          disabled={pendingDifficulty !== null}
          fontFamily={bodyFontFamily}
        />
      </View>
    );
  };

  const renderLocalPvPCard = () => (
    <View
      key="local-pvp"
      style={[
        styles.cardShell,
        styles.cardShellSingle,
      ]}
    >
      <ImageBackground
        source={quickPlayModePanel}
        resizeMode="stretch"
        style={styles.cardPanel}
        imageStyle={styles.cardPanelImage}
      >
        <View style={[styles.cardPanelContent, isCompactLayout && styles.cardPanelContentCompact]}>
          <View style={styles.cardTitleGroup}>
            <View style={[styles.iconWrap, styles.iconWrapLocalPvP]}>
              <MaterialIcons name="people" size={18} color="#3E8F87" />
            </View>
            <Text style={[styles.cardTitle, { fontFamily: titleFontFamily }]}>Same Device</Text>
          </View>
          <Text style={[styles.cardTagline, { fontFamily: bodyFontFamily }]}>Two human players</Text>
          <Text
            numberOfLines={isCompactLayout ? 4 : 3}
            style={[styles.cardDescription, { fontFamily: bodyFontFamily }]}
          >
            Pass the device back and forth with seven-piece Finkel rules and no bot turns.
          </Text>
        </View>
      </ImageBackground>

      <SketchButton
        label={isPreparingLocalPvP ? 'Preparing...' : 'Start Local PvP'}
        accessibilityLabel={isPreparingLocalPvP ? 'Preparing local PvP' : 'Start local PvP'}
        onPress={handleStartLocalPvP}
        wide
        disabled={isPreparingLocalPvP}
        fontFamily={bodyFontFamily}
      />
    </View>
  );

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
            isDesktopViewport && styles.scrollContentDesktop,
            isTightDesktopViewport && styles.scrollContentDesktopTight,
            {
              minHeight: height,
              paddingTop: topPadding,
              paddingBottom: bottomPadding,
              paddingHorizontal: horizontalPadding,
            },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.topBar}>
            <SketchButton
              label="Back"
              accessibilityLabel="Back"
              onPress={() => router.back()}
              iconName="arrow-back"
              fontFamily={bodyFontFamily}
            />
          </View>

          <View
            style={[
              styles.hero,
              isDesktopViewport && styles.heroDesktop,
              isTightDesktopViewport && styles.heroDesktopTight,
              { maxWidth: stageWidth },
            ]}
          >
            <Text
              style={[
                styles.title,
                isCompactLayout ? styles.titleCompact : styles.titleDesktop,
                { fontFamily: titleFontFamily },
              ]}
            >
              {heroTitle}
            </Text>
            <Text
              style={[
                styles.subtitle,
                isCompactLayout ? styles.subtitleCompact : styles.subtitleDesktop,
                { fontFamily: bodyFontFamily },
              ]}
            >
              {heroSubtitle}
            </Text>
            {isPracticeMode ? (
              <View style={styles.noteCard}>
                <Text style={[styles.noteText, { fontFamily: bodyFontFamily }]}>{GAME_MODE_SCREEN_NOTE}</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.stage, { width: stageWidth }]}>
            <View
              style={[
                styles.gridList,
                isLocalPvPMode && styles.gridListSingle,
                isCompactLayout && styles.gridListCompact,
                isDesktopViewport && styles.gridListDesktop,
              ]}
            >
              {isLocalPvPMode ? renderLocalPvPCard() : BOT_LEVELS.map(renderBotCard)}
            </View>
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
  scrollContent: {
    alignItems: 'center',
  },
  scrollContentDesktop: {
    justifyContent: 'center',
  },
  scrollContentDesktopTight: {
    justifyContent: 'flex-start',
  },
  backgroundTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(56, 30, 13, 0.08)',
  },
  topBar: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: urTheme.spacing.sm,
  },
  hero: {
    alignItems: 'center',
    marginBottom: urTheme.spacing.lg,
  },
  heroDesktop: {
    marginBottom: urTheme.spacing.md + 2,
  },
  heroDesktopTight: {
    marginBottom: urTheme.spacing.sm,
  },
  title: {
    color: '#22160C',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 244, 221, 0.32)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  titleDesktop: {
    fontSize: 34,
    lineHeight: 38,
  },
  titleCompact: {
    fontSize: 28,
    lineHeight: 32,
  },
  subtitle: {
    color: 'rgba(34, 22, 12, 0.88)',
    textAlign: 'center',
    maxWidth: 560,
  },
  subtitleDesktop: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: urTheme.spacing.sm,
  },
  subtitleCompact: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: urTheme.spacing.xs,
  },
  noteCard: {
    marginTop: urTheme.spacing.md,
    maxWidth: 620,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(90, 81, 72, 0.24)',
    backgroundColor: 'rgba(235, 220, 186, 0.78)',
  },
  noteText: {
    color: 'rgba(61, 46, 31, 0.88)',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  stage: {
    width: '100%',
    marginTop: urTheme.spacing.md,
  },
  gridList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: urTheme.spacing.md,
    width: '100%',
    alignSelf: 'center',
  },
  gridListCompact: {
    flexDirection: 'column',
    gap: urTheme.spacing.lg,
  },
  gridListSingle: {
    justifyContent: 'center',
  },
  gridListDesktop: {
    rowGap: urTheme.spacing.sm,
  },
  cardShell: {
    width: '48.5%',
    alignItems: 'center',
    gap: 14,
  },
  cardShellCompact: {
    width: '100%',
  },
  cardShellDesktop: {
    width: '48.75%',
  },
  cardShellSingle: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  cardPanel: {
    width: '100%',
    aspectRatio: MODE_PANEL_ART_ASPECT_RATIO,
    justifyContent: 'center',
    overflow: 'visible',
  },
  cardPanelImage: {
    width: '100%',
    height: '100%',
  },
  cardPanelContent: {
    position: 'absolute',
    top: '17%',
    left: '16%',
    right: '16%',
    bottom: '18%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPanelContentCompact: {
    top: '16%',
    left: '15%',
    right: '15%',
    bottom: '17%',
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 6,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  iconWrapLocalPvP: {
    borderColor: 'rgba(62, 143, 135, 0.34)',
    backgroundColor: 'rgba(62, 143, 135, 0.12)',
  },
  cardTitle: {
    color: '#4B2E12',
    fontSize: 17,
    lineHeight: 18,
    textAlign: 'center',
    flexShrink: 1,
  },
  cardTagline: {
    color: '#8A611B',
    fontSize: 11,
    lineHeight: 13,
    textAlign: 'center',
    marginBottom: 6,
  },
  cardDescription: {
    color: '#6B5740',
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
  },
});
