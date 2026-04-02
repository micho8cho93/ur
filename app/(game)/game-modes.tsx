import { XpRewardBadge } from '@/components/progression/XpRewardBadge';
import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { SketchButton } from '@/components/ui/SketchButton';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH, WideScreenBackground } from '@/components/ui/WideScreenBackground';
import { urTheme } from '@/constants/urTheme';
import { GAME_MODE_CONFIGS, type MatchModeId } from '@/logic/matchConfigs';
import { getXpAwardAmount } from '@/shared/progression';
import {
  HOME_FREDOKA_FONT_FAMILY,
  HOME_SUPERCELL_FONT_FAMILY,
  resolveHomeFredokaFontFamily,
  resolveHomeMagicFontFamily,
} from '@/src/home/homeTheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import {
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const homeWideBackground = require('../../assets/images/home_bg.png');
const homeMobileBackground = require('../../assets/images/home_bg_mobile.png');
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
    [HOME_FREDOKA_FONT_FAMILY]: require('../../assets/fonts/Fredoka-VariableFont_wdth,wght.ttf'),
    [HOME_SUPERCELL_FONT_FAMILY]: require('../../assets/fonts/Supercell-Magic-Regular.ttf'),
  });
  const showWideBackground = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH;
  const showMobileBackground = useMobileBackground();
  const isCompactLayout = width < 820;
  const isDesktopViewport = Platform.OS === 'web' && width >= 920;
  const isTightDesktopViewport = isDesktopViewport && height <= 820;
  const useThreeColumnLayout = isDesktopViewport && width >= 1100;
  const horizontalPadding = isDesktopViewport ? urTheme.spacing.lg : urTheme.spacing.md;
  const topPadding = insets.top + (isDesktopViewport ? 12 : 8);
  const bottomPadding = insets.bottom + (isCompactLayout ? urTheme.spacing.xl : urTheme.spacing.lg);
  const stageWidth = useThreeColumnLayout
    ? Math.min(width - horizontalPadding * 2, 1100)
    : isDesktopViewport
      ? Math.min(width - horizontalPadding * 2, 940)
      : isCompactLayout
        ? Math.min(width - horizontalPadding * 2, 430)
        : Math.min(width - horizontalPadding * 2, 780);
  const titleFontFamily = resolveHomeMagicFontFamily(fontsLoaded);
  const bodyFontFamily = resolveHomeFredokaFontFamily(fontsLoaded);

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
              Offline Games
            </Text>
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
                useThreeColumnLayout && styles.gridListThreeColumn,
              ]}
            >
              {GAME_MODE_CONFIGS.map((config) => (
                <View
                  key={config.modeId}
                  style={[
                    styles.cardShell,
                    isCompactLayout && styles.cardShellCompact,
                    isDesktopViewport && styles.cardShellDesktop,
                    useThreeColumnLayout && styles.cardShellThreeColumn,
                  ]}
                >
                  <ImageBackground
                    source={quickPlayModePanel}
                    resizeMode="stretch"
                    style={styles.cardPanel}
                    imageStyle={styles.cardPanelImage}
                  >
                    {config.allowsXp ? (
                      <XpRewardBadge
                        amount={getXpAwardAmount(config.offlineWinRewardSource)}
                        style={[
                          styles.rewardBadge,
                          useThreeColumnLayout && styles.rewardBadgeThreeColumn,
                        ]}
                      />
                    ) : null}
                    <View
                      style={[
                        styles.cardPanelContent,
                        isCompactLayout && styles.cardPanelContentCompact,
                        useThreeColumnLayout && styles.cardPanelContentThreeColumn,
                      ]}
                    >
                      <View style={styles.cardTitleGroup}>
                        <View style={styles.iconWrap}>
                          <MaterialIcons
                            name={MODE_ICONS[config.modeId as Exclude<MatchModeId, 'standard'>]}
                            size={useThreeColumnLayout ? 16 : 18}
                            color="#8A611B"
                          />
                        </View>
                        <Text
                          numberOfLines={2}
                          style={[
                            styles.cardTitle,
                            useThreeColumnLayout && styles.cardTitleThreeColumn,
                            { fontFamily: titleFontFamily },
                          ]}
                        >
                          {config.displayName}
                        </Text>
                      </View>

                      <Text
                        numberOfLines={useThreeColumnLayout ? 3 : 2}
                        style={[
                          styles.cardSubtitle,
                          useThreeColumnLayout && styles.cardSubtitleThreeColumn,
                          { fontFamily: bodyFontFamily },
                        ]}
                      >
                        {config.selectionSubtitle}
                      </Text>
                    </View>
                  </ImageBackground>

                  <SketchButton
                    label={`Choose ${config.displayName}`}
                    accessibilityLabel={`Choose ${config.displayName}`}
                    onPress={() => router.push(`/(game)/bot?modeId=${config.modeId}`)}
                    wide
                    fontFamily={bodyFontFamily}
                  />
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
  gridListThreeColumn: {
    rowGap: urTheme.spacing.md,
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
  cardShellThreeColumn: {
    width: '31.8%',
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
  cardPanelContentThreeColumn: {
    left: '14%',
    right: '14%',
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
    borderColor: 'rgba(138, 97, 27, 0.22)',
    backgroundColor: 'rgba(138, 97, 27, 0.08)',
    flexShrink: 0,
  },
  rewardBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 78,
    transform: [{ scale: 0.86 }],
  },
  rewardBadgeThreeColumn: {
    minWidth: 70,
    transform: [{ scale: 0.8 }],
  },
  cardTitle: {
    color: '#4B2E12',
    fontSize: 17,
    lineHeight: 18,
    textAlign: 'center',
    flexShrink: 1,
  },
  cardTitleThreeColumn: {
    fontSize: 15,
    lineHeight: 16,
  },
  cardSubtitle: {
    color: '#6B5740',
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
  },
  cardSubtitleThreeColumn: {
    fontSize: 12,
    lineHeight: 14,
  },
});
