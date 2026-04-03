import { XpRewardBadge } from '@/components/progression/XpRewardBadge';
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
import { GAME_MODE_CONFIGS, type MatchModeId } from '@/logic/matchConfigs';
import { getXpAwardAmount } from '@/shared/progression';
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
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const homeWideBackground = require('../../assets/images/bg_quickplay.png');
const homeMobileBackground = require('../../assets/images/bg_quickplay_mobile.png');
const quickPlayModePanel = require('../../assets/images/quick_play_mode_panel_cropped.png');

const MODE_PANEL_ART_ASPECT_RATIO = 1113 / 458;

const MODE_ICONS: Record<Exclude<MatchModeId, 'standard'>, keyof typeof MaterialIcons.glyphMap> = {
  gameMode_1_piece: 'casino',
  gameMode_3_pieces: 'flag',
  gameMode_5_pieces: 'filter-5',
  gameMode_finkel_rules: 'filter-7',
  gameMode_pvp: 'people',
  gameMode_capture: 'flash-on',
  gameMode_full_path: 'timeline',
};

export default function GameModesScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
                Offline Games
              </Text>
            </View>
            <Text
              style={[
                styles.subtitle,
                isCompactLayout ? styles.subtitleCompact : styles.subtitleDesktop,
                { fontFamily: bodyFontFamily },
              ]}
            >
              Choose a local ruleset and jump straight into a match.
            </Text>
          </View>

          <View style={[styles.stage, { width: stageWidth }]}>
            <View
              style={[
                styles.gridList,
                isCompactLayout && styles.gridListCompact,
                isDesktopViewport && styles.gridListDesktop,
              ]}
            >
              {GAME_MODE_CONFIGS.map((config) => (
                <View
                  key={config.modeId}
                  style={[
                    styles.cardShell,
                    isCompactLayout && styles.cardShellCompact,
                    isDesktopViewport && styles.cardShellDesktop,
                  ]}
                >
                  <PressablePanelCard
                    accessibilityLabel={`Choose ${config.displayName}`}
                    onPress={() => router.push(`/(game)/bot?modeId=${config.modeId}`)}
                    panelStyle={styles.cardPanel}
                    source={quickPlayModePanel}
                    imageStyle={styles.cardPanelImage}
                  >
                    {config.allowsXp ? (
                      <XpRewardBadge
                        amount={getXpAwardAmount(config.offlineWinRewardSource)}
                        style={styles.rewardBadge}
                      />
                    ) : null}
                    <View
                      style={[
                        styles.cardPanelContent,
                        isCompactLayout && styles.cardPanelContentCompact,
                      ]}
                    >
                      <View style={styles.cardTitleGroup}>
                        <View style={styles.iconWrap}>
                          <MaterialIcons
                            name={MODE_ICONS[config.modeId as Exclude<MatchModeId, 'standard'>]}
                            size={18}
                            color="#8A611B"
                          />
                        </View>
                        <Text
                          numberOfLines={2}
                          style={[
                            styles.cardTitle,
                            { fontFamily: buttonFontFamily },
                          ]}
                        >
                          {config.displayName}
                        </Text>
                      </View>

                      <Text
                        numberOfLines={2}
                        style={[
                          styles.cardSubtitle,
                          { fontFamily: bodyFontFamily },
                        ]}
                      >
                        {config.selectionSubtitle}
                      </Text>
                    </View>
                  </PressablePanelCard>
                </View>
              ))}
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
    marginBottom: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: urPanelColors.parchmentBorder,
    backgroundColor: urPanelColors.badgeSurface,
    flexShrink: 0,
  },
  rewardBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 78,
    transform: [{ scale: 0.86 }],
  },
  cardTitle: {
    color: urTextColors.titleOnPanel,
    fontSize: 17,
    lineHeight: 18,
    textAlign: 'center',
    flexShrink: 1,
    ...urTextVariants.cardTitle,
  },
  cardSubtitle: {
    color: urTextColors.bodyOnPanel,
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
    ...urTextVariants.body,
  },
});
