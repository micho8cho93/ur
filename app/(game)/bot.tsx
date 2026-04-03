import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { PressablePanelCard } from '@/components/ui/PressablePanelCard';
import { SketchButton } from '@/components/ui/SketchButton';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH, WideScreenBackground } from '@/components/ui/WideScreenBackground';
import {
  urPanelColors,
  urTextColors,
  urTextVariants,
  urTheme,
} from '@/constants/urTheme';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { BotDifficulty } from '@/logic/bot/types';
import { getMatchConfig } from '@/logic/matchConfigs';
import {
  HOME_FREDOKA_FONT_FAMILY,
  HOME_GROBOLD_FONT_FAMILY,
  HOME_SUPERCELL_FONT_FAMILY,
  resolveHomeButtonFontFamily,
  resolveHomeFredokaFontFamily,
  resolveHomeMagicFontFamily,
} from '@/src/home/homeTheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFonts } from 'expo-font';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const homeWideBackground = require('../../assets/images/home_bg.png');
const homeMobileBackground = require('../../assets/images/home_bg_mobile.png');
const quickPlayModePanel = require('../../assets/images/quick_play_mode_panel_cropped.png');

const MODE_PANEL_ART_ASPECT_RATIO = 1113 / 458;

type BotLevelCard = {
  difficulty: BotDifficulty;
  title: string;
  description: string;
  accent: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const BOT_LEVELS: readonly BotLevelCard[] = [
  {
    difficulty: 'easy',
    title: 'Easy',
    description: 'Random legal moves with no planning. Best for learning the board and testing lines.',
    accent: '#9E6D38',
    icon: 'wb-sunny',
  },
  {
    difficulty: 'medium',
    title: 'Medium',
    description: 'Values captures, rosettes, safer landings, and better short-term tempo.',
    accent: '#2B7A78',
    icon: 'flare',
  },
  {
    difficulty: 'hard',
    title: 'Hard',
    description: 'Searches future rolls and replies to build stronger long-form plans.',
    accent: '#2E6FD8',
    icon: 'psychology',
  },
  {
    difficulty: 'perfect',
    title: 'Perfect',
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
    [HOME_FREDOKA_FONT_FAMILY]: require('../../assets/fonts/LilitaOne-Regular.ttf'),
    [HOME_GROBOLD_FONT_FAMILY]: require('../../assets/fonts/LilitaOne-Regular.ttf'),
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
  const buttonFontFamily = resolveHomeButtonFontFamily(fontsLoaded);
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
    const isDisabled = pendingDifficulty !== null;

    return (
      <View
        key={level.difficulty}
        style={[
          styles.cardShell,
          isCompactLayout && styles.cardShellCompact,
          isDesktopViewport && styles.cardShellDesktop,
        ]}
      >
        <PressablePanelCard
          accessibilityLabel={isPending ? `Preparing ${level.title}` : `Play ${level.title}`}
          disabled={isDisabled}
          dimmed={!isPending && isDisabled}
          onPress={() => handleSelect(level.difficulty)}
          panelStyle={styles.cardPanel}
          source={quickPlayModePanel}
          imageStyle={styles.cardPanelImage}
        >
          <View style={[styles.cardPanelContent, isCompactLayout && styles.cardPanelContentCompact]}>
            <View style={styles.cardTitleGroup}>
              <View style={[styles.iconWrap, { borderColor: `${level.accent}40`, backgroundColor: `${level.accent}18` }]}>
                <MaterialIcons name={level.icon} size={18} color={level.accent} />
              </View>
              <Text style={[styles.cardTitle, { fontFamily: buttonFontFamily }]}>{level.title}</Text>
            </View>
            <Text
              numberOfLines={isCompactLayout ? 4 : 3}
              style={[styles.cardDescription, { fontFamily: bodyFontFamily }]}
            >
              {isPending ? 'Launching your offline game with this difficulty.' : level.description}
            </Text>
          </View>
        </PressablePanelCard>
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
      <PressablePanelCard
        accessibilityLabel={isPreparingLocalPvP ? 'Preparing local PvP' : 'Start local PvP'}
        disabled={isPreparingLocalPvP}
        dimmed={false}
        onPress={handleStartLocalPvP}
        panelStyle={styles.cardPanel}
        source={quickPlayModePanel}
        imageStyle={styles.cardPanelImage}
      >
        <View style={[styles.cardPanelContent, isCompactLayout && styles.cardPanelContentCompact]}>
          <View style={styles.cardTitleGroup}>
            <View style={[styles.iconWrap, styles.iconWrapLocalPvP]}>
              <MaterialIcons name="people" size={18} color="#3E8F87" />
            </View>
            <Text style={[styles.cardTitle, { fontFamily: buttonFontFamily }]}>Same Device</Text>
          </View>
          <Text style={[styles.cardTagline, { fontFamily: bodyFontFamily }]}>
            {isPreparingLocalPvP ? 'Preparing match...' : 'Two human players'}
          </Text>
          <Text
            numberOfLines={isCompactLayout ? 4 : 3}
            style={[styles.cardDescription, { fontFamily: bodyFontFamily }]}
          >
            {isPreparingLocalPvP
              ? 'Launching a same-device match with no bot turns.'
              : 'Pass the device back and forth with seven-piece Finkel rules and no bot turns.'}
          </Text>
        </View>
      </PressablePanelCard>
    </View>
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
              fontFamily={buttonFontFamily}
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
            <View style={styles.titleWrap}>
              <Text
                style={[
                  styles.title,
                  isCompactLayout ? styles.titleCompact : styles.titleDesktop,
                  { fontFamily: titleFontFamily },
                ]}
              >
                {heroTitle}
              </Text>
            </View>
            <Text
              style={[
                styles.subtitle,
                isCompactLayout ? styles.subtitleCompact : styles.subtitleDesktop,
                { fontFamily: bodyFontFamily },
              ]}
            >
              {heroSubtitle}
            </Text>
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
    backgroundColor: urPanelColors.sceneOverlay,
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
  titleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: urTextColors.titleOnScene,
    textAlign: 'center',
    ...urTextVariants.displayTitle,
  },
  titleDesktop: {
    fontSize: 36,
    lineHeight: 40,
  },
  titleCompact: {
    fontSize: 30,
    lineHeight: 34,
  },
  subtitle: {
    color: urTextColors.bodyOnPanel,
    textAlign: 'center',
    maxWidth: 680,
    fontSize: 16,
    lineHeight: 22,
    ...urTextVariants.body,
  },
  subtitleDesktop: {
    marginTop: urTheme.spacing.sm,
  },
  subtitleCompact: {
    marginTop: urTheme.spacing.xs,
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
    left: '13.6%',
    right: '13.6%',
    bottom: '18%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPanelContentCompact: {
    top: '16%',
    left: '12.75%',
    right: '12.75%',
    bottom: '17%',
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 8,
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
    borderColor: 'rgba(45, 156, 219, 0.24)',
    backgroundColor: 'rgba(45, 156, 219, 0.14)',
  },
  cardTitle: {
    color: urTextColors.titleOnPanel,
    fontSize: 17,
    lineHeight: 18,
    textAlign: 'center',
    flexShrink: 1,
    ...urTextVariants.cardTitle,
  },
  cardTagline: {
    color: urTextColors.bodyOnPanel,
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
    marginBottom: 6,
    ...urTextVariants.body,
  },
  cardDescription: {
    color: urTextColors.bodyOnPanel,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
    width: '84%',
    minHeight: 34,
    alignSelf: 'center',
    ...urTextVariants.body,
  },
});
