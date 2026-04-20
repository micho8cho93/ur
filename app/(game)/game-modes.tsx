import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { PressablePanelCard } from '@/components/ui/PressablePanelCard';
import { SketchButton } from '@/components/ui/SketchButton';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH, WideScreenBackground } from '@/components/ui/WideScreenBackground';
import { urPanelColors, urTextColors, urTextVariants, urTheme } from '@/constants/urTheme';
import { getMatchConfig } from '@/logic/matchConfigs';
import {
  buildGameModeMatchConfig,
  resolveGameModeBoardLabel,
  resolveGameModeSummary,
} from '@/shared/gameModes';
import {
  buildOfflineMatchEconomyDetails,
  hasVisibleMatchEconomyRows,
  type MatchEconomyDetails,
} from '@/shared/matchEconomy';
import { getPublicGameModes } from '@/services/gameModes';
import {
  HOME_FREDOKA_FONT_FAMILY,
  HOME_GROBOLD_FONT_FAMILY,
  HOME_SUPERCELL_FONT_FAMILY,
  resolveHomeButtonFontFamily,
  resolveHomeFredokaFontFamily,
  resolveHomeMagicFontFamily,
} from '@/src/home/homeTheme';
import { MatchEconomyInfoButton } from '@/components/match/MatchEconomyInfoButton';
import { MatchEconomyInfoModal } from '@/components/match/MatchEconomyInfoModal';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const homeWideBackground = require('../../assets/images/bg_quickplay.png');
const homeMobileBackground = require('../../assets/images/bg_quickplay_mobile.png');
const quickPlayModePanel = require('../../assets/images/quick_play_mode_panel_cropped.png');

const MODE_PANEL_ART_ASPECT_RATIO = 1113 / 458;

type MatchEconomyModalState = {
  title: string;
  details: MatchEconomyDetails;
};

const BUILT_IN_MODES = [
  {
    modeId: 'gameMode_3_pieces',
    label: 'Race',
    icon: 'flag' as const,
  },
  {
    modeId: 'gameMode_finkel_rules',
    label: 'Finkel Rules',
    icon: 'filter-7' as const,
  },
  {
    modeId: 'gameMode_pvp',
    label: 'PvP',
    icon: 'people' as const,
  },
] as const;

type GameModeCardProps = {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  onInfoPress: () => void;
  showInfoButton: boolean;
  accessibilityLabel: string;
  disabled?: boolean;
  dimmed?: boolean;
  titleFontFamily: string;
  bodyFontFamily: string;
};

function GameModeCard({
  title,
  subtitle,
  icon,
  onPress,
  onInfoPress,
  showInfoButton,
  accessibilityLabel,
  disabled = false,
  dimmed = false,
  titleFontFamily,
  bodyFontFamily,
}: GameModeCardProps) {
  return (
    <View style={styles.cardFrame}>
      <PressablePanelCard
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        dimmed={dimmed}
        onPress={onPress}
        panelStyle={styles.cardPanel}
        source={quickPlayModePanel}
        imageStyle={styles.cardPanelImage}
      >
        <View style={styles.cardPanelContent}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleLeading}>
              <View style={styles.iconWrap}>
                <MaterialIcons name={icon} size={18} color="#8A611B" />
              </View>
              <Text numberOfLines={2} style={[styles.cardTitle, { fontFamily: titleFontFamily }]}>
                {title}
              </Text>
            </View>
            {showInfoButton ? (
              <MatchEconomyInfoButton
                accessibilityLabel={`Open economy details for ${title}`}
                onPress={onInfoPress}
                style={styles.cardInfoButton}
              />
            ) : null}
          </View>
          <Text numberOfLines={2} style={[styles.cardSubtitle, { fontFamily: bodyFontFamily }]}>
            {subtitle}
          </Text>
        </View>
      </PressablePanelCard>
    </View>
  )
}

export default function GameModesScreen() {
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [fontsLoaded] = useFonts({
    [HOME_FREDOKA_FONT_FAMILY]: require('../../assets/fonts/LilitaOne-Regular.ttf'),
    [HOME_GROBOLD_FONT_FAMILY]: require('../../assets/fonts/LilitaOne-Regular.ttf'),
    [HOME_SUPERCELL_FONT_FAMILY]: require('../../assets/fonts/Supercell-Magic-Regular.ttf'),
  })
  const [publicModes, setPublicModes] = React.useState<Awaited<ReturnType<typeof getPublicGameModes>> | null>(null)
  const [isLoadingModes, setIsLoadingModes] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const showWideBackground = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH
  const showMobileBackground = useMobileBackground()
  const isCompactLayout = width < 820
  const isDesktopViewport = Platform.OS === 'web' && width >= 920
  const isTightDesktopViewport = isDesktopViewport && height <= 820
  const horizontalPadding = isDesktopViewport ? urTheme.spacing.lg : urTheme.spacing.md
  const topPadding = insets.top + (isDesktopViewport ? 12 : 8)
  const bottomPadding = insets.bottom + (isCompactLayout ? urTheme.spacing.xl : urTheme.spacing.lg)
  const stageWidth = isDesktopViewport
    ? Math.min(width - horizontalPadding * 2, 940)
    : isCompactLayout
      ? Math.min(width - horizontalPadding * 2, 430)
      : Math.min(width - horizontalPadding * 2, 780)
  const builtInStageWidth = isDesktopViewport ? Math.min(width - horizontalPadding * 2, 1392) : stageWidth
  const titleFontFamily = resolveHomeMagicFontFamily(fontsLoaded)
  const bodyFontFamily = resolveHomeFredokaFontFamily(fontsLoaded)
  const buttonFontFamily = resolveHomeButtonFontFamily(fontsLoaded)
  const [economyModal, setEconomyModal] = React.useState<MatchEconomyModalState | null>(null)

  const builtInCards = BUILT_IN_MODES.map((mode) => {
    const config = getMatchConfig(mode.modeId)
    const economyDetails = buildOfflineMatchEconomyDetails(config)
    return {
      modeId: mode.modeId,
      label: mode.label,
      icon: mode.icon,
      subtitle: config.selectionSubtitle ?? config.displayName,
      economyDetails,
      showInfoButton: hasVisibleMatchEconomyRows(economyDetails),
    }
  })

  const openEconomyDetails = (title: string, details: MatchEconomyDetails) => {
    setEconomyModal({ title, details })
  }

  const activeAdminModes = publicModes?.activeModes ?? []
  const featuredMode = publicModes?.featuredMode ?? null
  const activeFeaturedMode =
    featuredMode && activeAdminModes.some((mode) => mode.id === featuredMode.id) ? featuredMode : null
  const featuredEconomyDetails = activeFeaturedMode
    ? buildOfflineMatchEconomyDetails(buildGameModeMatchConfig(activeFeaturedMode))
    : null
  const showFeaturedEconomyInfo = Boolean(featuredEconomyDetails && hasVisibleMatchEconomyRows(featuredEconomyDetails))

  React.useEffect(() => {
    let active = true

    const loadModes = async () => {
      setIsLoadingModes(true)
      setErrorMessage(null)

      try {
        const nextModes = await getPublicGameModes()
        if (!active) {
          return
        }
        setPublicModes(nextModes)
      } catch (error) {
        if (!active) {
          return
        }
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load featured game modes.')
        setPublicModes(null)
      } finally {
        if (active) {
          setIsLoadingModes(false)
        }
      }
    }

    void loadModes()

    return () => {
      active = false
    }
  }, [])

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
              Choose a built-in mode, then explore the featured mode.
            </Text>
          </View>

          {errorMessage ? (
            <View style={[styles.noticeCard, { maxWidth: stageWidth }]}>
              <Text style={[styles.noticeTitle, { fontFamily: titleFontFamily }]}>Featured modes unavailable</Text>
              <Text style={[styles.noticeText, { fontFamily: bodyFontFamily }]}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={[styles.stage, { width: builtInStageWidth }]}>
            <View
              style={[
                styles.gridList,
                styles.gridListBuiltIn,
                isCompactLayout && styles.gridListCompact,
                isDesktopViewport && styles.gridListDesktop,
              ]}
            >
              {builtInCards.map((card) => (
                <View
                  key={card.modeId}
                  style={[
                    styles.cardShell,
                    styles.cardShellBuiltIn,
                    isCompactLayout && styles.cardShellCompact,
                  ]}
                >
                  <GameModeCard
                    accessibilityLabel={`Choose ${card.label}`}
                    icon={card.icon}
                    onPress={() => router.push(`/(game)/bot?modeId=${card.modeId}`)}
                    onInfoPress={() => openEconomyDetails(`${card.label} Economy`, card.economyDetails)}
                    showInfoButton={card.showInfoButton}
                    subtitle={card.subtitle}
                    title={card.label}
                    titleFontFamily={buttonFontFamily}
                    bodyFontFamily={bodyFontFamily}
                  />
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.stage, { width: stageWidth }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { fontFamily: titleFontFamily }]}>Game Mode of the Month</Text>
                <Text style={[styles.sectionSubtitle, { fontFamily: bodyFontFamily }]}>
                  {isLoadingModes
                    ? 'Loading featured catalog content.'
                    : activeFeaturedMode
                      ? activeFeaturedMode.description
                      : 'No active featured mode is currently configured.'}
                </Text>
              </View>
            </View>

            {isLoadingModes ? (
              <View style={styles.loadingCard}>
                <Text style={[styles.loadingTitle, { fontFamily: titleFontFamily }]}>Loading featured mode...</Text>
                <Text style={[styles.loadingText, { fontFamily: bodyFontFamily }]}>
                  Checking the Nakama-backed mode catalog for a featured pick.
                </Text>
              </View>
            ) : activeFeaturedMode ? (
              <View style={styles.featuredShell}>
                <View style={styles.cardFrame}>
                  <PressablePanelCard
                    accessibilityLabel={`Play featured mode ${activeFeaturedMode.name}`}
                    onPress={() => router.push(`/(game)/bot?modeId=${activeFeaturedMode.id}`)}
                    panelStyle={styles.featuredPanel}
                    source={quickPlayModePanel}
                    imageStyle={styles.cardPanelImage}
                  >
                    <View style={styles.featuredContent}>
                      <View style={styles.featuredTopRow}>
                        <View style={styles.iconWrap}>
                          <MaterialIcons name="stars" size={18} color="#8A611B" />
                        </View>
                        <Text style={[styles.featuredLabel, { fontFamily: buttonFontFamily }]}>Game Mode of the Month</Text>
                      </View>
                      <View style={styles.featuredTitleRow}>
                        <Text style={[styles.featuredTitle, { fontFamily: titleFontFamily }]}>{activeFeaturedMode.name}</Text>
                        {showFeaturedEconomyInfo && featuredEconomyDetails ? (
                          <MatchEconomyInfoButton
                            accessibilityLabel={`Open economy details for ${activeFeaturedMode.name}`}
                            onPress={() =>
                              openEconomyDetails(`${activeFeaturedMode.name} Economy`, featuredEconomyDetails)
                            }
                            style={styles.cardInfoButton}
                          />
                        ) : null}
                      </View>
                      <Text style={[styles.featuredSubtitle, { fontFamily: bodyFontFamily }]}>
                        {resolveGameModeSummary(activeFeaturedMode)}
                      </Text>
                      <Text style={[styles.featuredMeta, { fontFamily: bodyFontFamily }]}>
                        {resolveGameModeBoardLabel(activeFeaturedMode.boardAssetKey)} · Featured and playable
                      </Text>
                    </View>
                  </PressablePanelCard>
                </View>
              </View>
            ) : (
              <View style={styles.loadingCard}>
                <Text style={[styles.loadingTitle, { fontFamily: titleFontFamily }]}>No active featured mode</Text>
                <Text style={[styles.loadingText, { fontFamily: bodyFontFamily }]}>
                  Feature a saved mode to surface it here.
                </Text>
              </View>
            )}
          </View>

        </ScrollView>
        <MatchEconomyInfoModal
          visible={Boolean(economyModal)}
          title={economyModal?.title ?? 'Match Economy'}
          details={economyModal?.details ?? null}
          onClose={() => setEconomyModal(null)}
        />
      </View>
    </>
  )
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
  sectionHeader: {
    marginBottom: urTheme.spacing.sm,
  },
  sectionTitle: {
    color: urTextColors.titleOnScene,
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 4,
    ...urTextVariants.sectionTitle,
  },
  sectionSubtitle: {
    color: urTextColors.bodyOnPanel,
    fontSize: 14,
    lineHeight: 18,
    ...urTextVariants.body,
  },
  gridList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: urTheme.spacing.md,
    width: '100%',
    alignSelf: 'center',
  },
  gridListBuiltIn: {
    gap: urTheme.spacing.sm,
    flexWrap: 'nowrap',
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
  cardShellBuiltIn: {
    width: '32.5%',
  },
  cardShellCompact: {
    width: '100%',
  },
  cardShellDesktop: {
    width: '48.75%',
  },
  cardFrame: {
    width: '100%',
    position: 'relative',
    overflow: 'visible',
  },
  cardPanel: {
    width: '100%',
    aspectRatio: MODE_PANEL_ART_ASPECT_RATIO,
    justifyContent: 'center',
    overflow: 'visible',
  },
  featuredShell: {
    width: '100%',
  },
  featuredPanel: {
    width: '100%',
    minHeight: 220,
    justifyContent: 'center',
    overflow: 'visible',
  },
  featuredContent: {
    position: 'absolute',
    top: '14%',
    left: '12%',
    right: '12%',
    bottom: '14%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  featuredLabel: {
    color: urTextColors.titleOnPanel,
    fontSize: 15,
    lineHeight: 18,
    ...urTextVariants.cardTitle,
  },
  featuredTitle: {
    color: urTextColors.titleOnPanel,
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 8,
    ...urTextVariants.displayTitle,
  },
  featuredSubtitle: {
    color: urTextColors.bodyOnPanel,
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 560,
    marginBottom: 8,
    ...urTextVariants.body,
  },
  featuredMeta: {
    color: urTextColors.bodyOnPanel,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    ...urTextVariants.body,
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 10,
    marginBottom: 8,
  },
  cardTitleLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
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
  cardInfoButton: {
    flexShrink: 0,
    alignSelf: 'center',
  },
  cardTitle: {
    color: urTextColors.titleOnPanel,
    fontSize: 17,
    lineHeight: 18,
    textAlign: 'left',
    flexShrink: 1,
    ...urTextVariants.cardTitle,
  },
  featuredTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 10,
    marginBottom: 8,
  },
  cardSubtitle: {
    color: urTextColors.bodyOnPanel,
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
    ...urTextVariants.body,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: urTheme.spacing.xl,
    paddingHorizontal: urTheme.spacing.lg,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 18, 8, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(246, 214, 151, 0.24)',
  },
  loadingTitle: {
    color: urTextColors.titleOnScene,
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 6,
    ...urTextVariants.displayTitle,
  },
  loadingText: {
    color: urTextColors.bodyOnPanel,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 18,
    ...urTextVariants.body,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: urTheme.spacing.sm,
    marginBottom: urTheme.spacing.md,
  },
  statChip: {
    backgroundColor: 'rgba(26, 18, 8, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(246, 214, 151, 0.24)',
    borderRadius: 12,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    alignItems: 'center',
    minWidth: 80,
    flex: 1,
  },
  statValue: {
    color: urTextColors.titleOnScene,
    fontSize: 22,
    lineHeight: 26,
    textAlign: 'center',
    ...urTextVariants.displayTitle,
  },
  statLabel: {
    color: urTextColors.bodyOnPanel,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    ...urTextVariants.body,
  },
  rulesetList: {
    gap: urTheme.spacing.sm,
  },
  rulesetRow: {
    backgroundColor: 'rgba(26, 18, 8, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(246, 214, 151, 0.18)',
    borderRadius: 14,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm + 2,
  },
  rulesetRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  rulesetName: {
    color: urTextColors.titleOnScene,
    fontSize: 15,
    lineHeight: 18,
    ...urTextVariants.cardTitle,
  },
  rulesetTags: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  rulesetTag: {
    backgroundColor: 'rgba(246, 214, 151, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rulesetTagWarning: {
    backgroundColor: 'rgba(200, 100, 50, 0.2)',
  },
  rulesetTagText: {
    color: urTextColors.bodyOnPanel,
    fontSize: 11,
    lineHeight: 14,
    ...urTextVariants.body,
  },
  rulesetDesc: {
    color: urTextColors.bodyOnPanel,
    fontSize: 13,
    lineHeight: 17,
    ...urTextVariants.body,
  },
  noticeCard: {
    width: '100%',
    paddingHorizontal: urTheme.spacing.lg,
    paddingVertical: urTheme.spacing.md,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 18, 8, 0.26)',
    borderWidth: 1,
    borderColor: 'rgba(246, 214, 151, 0.24)',
    marginBottom: urTheme.spacing.sm,
  },
  noticeTitle: {
    color: urTextColors.titleOnScene,
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 4,
    ...urTextVariants.displayTitle,
  },
  noticeText: {
    color: urTextColors.bodyOnPanel,
    fontSize: 14,
    lineHeight: 18,
    ...urTextVariants.body,
  },
});
