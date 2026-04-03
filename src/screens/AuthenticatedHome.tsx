import { HomeActionButton } from '@/components/home/HomeActionButton';
import { ChallengeSummaryCard } from '@/components/challenges/ChallengeSummaryCard';
import { EloRatingSummaryCard } from '@/components/elo/EloRatingSummaryCard';
import { ProgressionModal } from '@/components/progression/ProgressionModal';
import { ProgressionSummaryCard } from '@/components/progression/ProgressionSummaryCard';
import { SketchButton } from '@/components/ui/SketchButton';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH } from '@/components/ui/WideScreenBackground';
import { urTheme } from '@/constants/urTheme';
import { useAuth } from '@/src/auth/useAuth';
import { useProgression } from '@/src/progression/useProgression';
import {
  HOME_FREDOKA_FONT_FAMILY,
  HOME_GROBOLD_FONT_FAMILY,
  HOME_SUPERCELL_FONT_FAMILY,
  HomeLayoutVariant,
  resolveHomeButtonFontFamily,
  resolveHomeUsernameFontFamily,
} from '@/src/home/homeTheme';
import { useScreenTransition } from '@/src/transitions/ScreenTransitionContext';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
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
const logoArt = require('../../assets/images/login_logo_legacy.png');
const HOME_LOGO_VISIBLE_ASPECT_RATIO = 708 / 662;

export default function AuthenticatedHome() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const runScreenTransition = useScreenTransition();
  const { user, logout } = useAuth();
  const { progression } = useProgression();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isProgressionModalOpen, setIsProgressionModalOpen] = React.useState(false);
  const [fontsLoaded] = useFonts({
    [HOME_FREDOKA_FONT_FAMILY]: require('../../assets/fonts/LilitaOne-Regular.ttf'),
    [HOME_GROBOLD_FONT_FAMILY]: require('../../assets/fonts/LilitaOne-Regular.ttf'),
    [HOME_SUPERCELL_FONT_FAMILY]: require('../../assets/fonts/Supercell-Magic-Regular.ttf'),
  });

  const isDesktopLayout = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH;
  const isCompactWebLayout = Platform.OS === 'web' && !isDesktopLayout;
  const layoutVariant: HomeLayoutVariant = isDesktopLayout ? 'desktop' : 'compact';
  const sceneSource = isDesktopLayout ? homeWideBackground : homeMobileBackground;
  const topPadding = insets.top + (isDesktopLayout ? urTheme.spacing.sm : urTheme.spacing.sm);
  const bottomPadding = insets.bottom + (isDesktopLayout ? urTheme.spacing.md : urTheme.spacing.lg);
  const horizontalPadding = isDesktopLayout ? urTheme.spacing.md : urTheme.spacing.md;
  const stageWidth = isDesktopLayout
    ? Math.min(width - horizontalPadding * 2, 980, Math.max(900, height * 1.06))
    : Math.min(width - horizontalPadding * 2, 320);
  const logoWidth = isDesktopLayout
    ? Math.min(width * 0.27, height * 0.43, 420)
    : Math.min(width * 0.38, 190);
  const logoPanelWidth = isDesktopLayout ? logoWidth * 0.62 : logoWidth * 0.76;
  const logoPanelHeight = logoPanelWidth / HOME_LOGO_VISIBLE_ASPECT_RATIO;
  const usernameFontFamily = resolveHomeUsernameFontFamily(fontsLoaded);
  const buttonFontFamily = resolveHomeButtonFontFamily(fontsLoaded);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleBackToLogin = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleTutorialPress = () => {
    const route = `/match/local-${Date.now()}?offline=1&tutorial=playthrough&botDifficulty=easy` as never;
    const navigate = () => router.push(route);

    void runScreenTransition({
      title: 'Preparing Tutorial',
      message: 'Laying out the guided board and loading the lesson.',
      preActionDelayMs: 980,
      postActionDelayMs: 260,
      action: navigate,
    }).then((didStart) => {
      if (!didStart) {
        navigate();
      }
    });
  };

  const renderUtilitySketchButton = ({
    label,
    accessibilityLabel,
    onPress,
    iconName,
    disabled = false,
  }: {
    label: string;
    accessibilityLabel: string;
    onPress: () => void;
    iconName?: React.ComponentProps<typeof SketchButton>['iconName'];
    disabled?: boolean;
  }) => (
    <SketchButton
      label={label}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      iconName={iconName}
      disabled={disabled}
      fontFamily={buttonFontFamily}
    />
  );

  const renderUtilityControl = () => {
    if (user?.provider === 'guest') {
      if (isCompactWebLayout) {
        return null;
      }

      return renderUtilitySketchButton({
        label: 'Back',
        accessibilityLabel: 'Back to login',
        onPress: () => {
          void handleBackToLogin();
        },
        iconName: 'arrow-back',
      });
    }

    return null;
  };

  const renderUtilityAction = () => {
    if (user?.provider === 'guest') {
      if (isCompactWebLayout) {
        return renderUtilitySketchButton({
          label: 'Back',
          accessibilityLabel: 'Back to login',
          onPress: () => {
            void handleBackToLogin();
          },
          iconName: 'arrow-back',
        });
      }

      return <View style={styles.utilitySpacer} />;
    }

    return renderUtilitySketchButton({
      label: isLoggingOut ? 'Logging out' : 'Logout',
      accessibilityLabel: 'Logout',
      onPress: () => {
        void handleLogout();
      },
      disabled: isLoggingOut,
    });
  };

  const renderIdentityLabel = () => (
    <Text
      numberOfLines={1}
      style={[
        styles.utilityUsername,
        isDesktopLayout ? styles.utilityUsernameDesktop : styles.utilityUsernameCompact,
        { fontFamily: usernameFontFamily },
      ]}
    >
      {user?.username ?? 'Player'}
    </Text>
  );

  const utilityBarContent = (
    <View style={styles.topOverlayRow}>
      <View testID="authenticated-home-utility-left" style={styles.topOverlayLeft}>
        {renderUtilityControl()}
        {renderIdentityLabel()}
      </View>
      <View testID="authenticated-home-utility-right" style={styles.topOverlayRight}>
        {renderUtilityAction()}
      </View>
    </View>
  );

  const homeContent = (
    <View style={styles.content}>
      <View
        style={[
          styles.header,
          isDesktopLayout ? styles.headerDesktop : styles.headerCompact,
        ]}
      >
        <View style={[styles.logoPanel, { width: logoPanelWidth, height: logoPanelHeight }]}>
          <View style={[styles.logoWrap, { width: logoWidth, height: logoWidth * 0.88 }]}>
            <Image
              source={logoArt}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel="UR Legacy"
              style={styles.logo}
            />
          </View>
        </View>
      </View>

      <View style={[styles.stage, { width: stageWidth }]}>
        <View style={[styles.stageGrid, isDesktopLayout ? styles.stageGridDesktop : styles.stageGridCompact]}>
          <View style={[styles.stageColumn, isDesktopLayout ? styles.stageColumnDesktop : styles.stageColumnCompact]}>
            <ProgressionSummaryCard
              layoutVariant={layoutVariant}
              fontLoaded={fontsLoaded}
              onOpenRank={() => setIsProgressionModalOpen(true)}
              style={styles.stageCard}
            />
            <HomeActionButton
              title="Quick Play"
              tone="gold"
              fontLoaded={fontsLoaded}
              compact={!isDesktopLayout}
              onPress={() => router.push('/(game)/game-modes')}
              style={[styles.stageActionButton, isDesktopLayout ? styles.stageActionButtonDesktop : styles.stageActionButtonCompact]}
            />
          </View>

          <View style={[styles.stageColumn, isDesktopLayout ? styles.stageColumnDesktop : styles.stageColumnCompact]}>
            <EloRatingSummaryCard
              layoutVariant={layoutVariant}
              fontLoaded={fontsLoaded}
              style={styles.stageCard}
            />
            <HomeActionButton
              title="Play Online"
              tone="gold"
              fontLoaded={fontsLoaded}
              compact={!isDesktopLayout}
              onPress={() => router.push('/(game)/lobby?mode=online')}
              style={[styles.stageActionButton, isDesktopLayout ? styles.stageActionButtonDesktop : styles.stageActionButtonCompact]}
            />
          </View>

          <View style={[styles.stageColumn, isDesktopLayout ? styles.stageColumnDesktop : styles.stageColumnCompact]}>
            <ChallengeSummaryCard
              layoutVariant={layoutVariant}
              fontLoaded={fontsLoaded}
              style={styles.stageCard}
            />
            <HomeActionButton
              title="Tutorial"
              tone="gold"
              fontLoaded={fontsLoaded}
              compact={!isDesktopLayout}
              onPress={handleTutorialPress}
              style={[styles.stageActionButton, isDesktopLayout ? styles.stageActionButtonDesktop : styles.stageActionButtonCompact]}
            />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <Image source={sceneSource} resizeMode="cover" style={styles.backgroundImage} />
      <View style={styles.backgroundTint} />

      {!isCompactWebLayout ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.topOverlayFloating,
            {
              top: topPadding,
              left: horizontalPadding,
              right: horizontalPadding,
            },
          ]}
        >
          {utilityBarContent}
        </View>
      ) : null}

      {isDesktopLayout ? (
        <View
          style={[
            styles.desktopViewport,
            {
              minHeight: height,
              paddingTop: topPadding + 8,
              paddingBottom: bottomPadding,
              paddingHorizontal: horizontalPadding,
            },
          ]}
        >
          {homeContent}
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              minHeight: height,
              paddingTop: topPadding + (isCompactWebLayout ? 8 : 48),
              paddingBottom: bottomPadding,
              paddingHorizontal: horizontalPadding,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isCompactWebLayout ? <View style={styles.topOverlayInline}>{utilityBarContent}</View> : null}
          {homeContent}
        </ScrollView>
      )}

      <ProgressionModal
        visible={isProgressionModalOpen}
        onClose={() => setIsProgressionModalOpen(false)}
        progression={progression}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#43250F',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backgroundTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(56, 30, 13, 0.08)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  desktopViewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: urTheme.spacing.sm,
  },
  topOverlayFloating: {
    position: 'absolute',
    zIndex: 10,
  },
  topOverlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  topOverlayInline: {
    width: '100%',
    marginBottom: 10,
  },
  topOverlayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
    minHeight: 42,
  },
  topOverlayRight: {
    minHeight: 42,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  utilitySpacer: {
    width: 88,
    height: 42,
  },
  utilityUsername: {
    color: '#FFF5DE',
    textShadowColor: 'rgba(72, 31, 10, 0.54)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
    flexShrink: 1,
  },
  utilityUsernameDesktop: {
    fontSize: 26,
    lineHeight: 30,
  },
  utilityUsernameCompact: {
    fontSize: 22,
    lineHeight: 26,
  },
  header: {
    alignItems: 'center',
  },
  headerDesktop: {
    marginTop: 10,
  },
  headerCompact: {
    marginTop: -6,
  },
  logoPanel: {
    position: 'relative',
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  stage: {
    width: '100%',
    alignItems: 'center',
    marginTop: 34,
  },
  stageGrid: {
    width: '100%',
  },
  stageGridDesktop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: urTheme.spacing.md,
  },
  stageGridCompact: {
    alignItems: 'center',
    gap: urTheme.spacing.lg,
  },
  stageColumn: {
    alignItems: 'center',
  },
  stageColumnDesktop: {
    flex: 1,
    maxWidth: 300,
  },
  stageColumnCompact: {
    width: '100%',
    maxWidth: 300,
  },
  stageCard: {
    width: '100%',
    position: 'relative',
    top: 10,
  },
  stageActionButton: {
    marginTop: 10,
  },
  stageActionButtonDesktop: {
    width: '82%',
    marginTop: 18,
  },
  stageActionButtonCompact: {
    width: '82%',
  },
});
