import { HomeActionButton } from '@/components/home/HomeActionButton';
import { ChallengeSummaryCard } from '@/components/challenges/ChallengeSummaryCard';
import { EloRatingSummaryCard } from '@/components/elo/EloRatingSummaryCard';
import { ProgressionModal } from '@/components/progression/ProgressionModal';
import { ProgressionSummaryCard } from '@/components/progression/ProgressionSummaryCard';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH } from '@/components/ui/WideScreenBackground';
import { urTheme } from '@/constants/urTheme';
import { useAuth } from '@/src/auth/useAuth';
import { useProgression } from '@/src/progression/useProgression';
import {
  HOME_FREDOKA_FONT_FAMILY,
  HOME_SUPERCELL_FONT_FAMILY,
  HomeLayoutVariant,
  resolveHomeUsernameFontFamily,
} from '@/src/home/homeTheme';
import { useScreenTransition } from '@/src/transitions/ScreenTransitionContext';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  Image,
  Platform,
  Pressable,
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
const HOME_UTILITY_BUTTON_ROTATION = '-1.2deg';
const HOME_SECONDARY_BUTTON_BACKGROUND = '#B9B4AC';
const HOME_SECONDARY_BUTTON_BORDER = '#5A5148';
const HOME_SECONDARY_BUTTON_TEXT = '#3D362F';
const HOME_SECONDARY_BUTTON_SKETCH = 'rgba(74, 66, 58, 0.18)';

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
    [HOME_FREDOKA_FONT_FAMILY]: require('../../assets/fonts/Fredoka-VariableFont_wdth,wght.ttf'),
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
    iconName?: React.ComponentProps<typeof MaterialIcons>['name'];
    disabled?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed, hovered, focused }) => [
        styles.utilitySketchButton,
        hovered && !disabled && styles.utilitySketchButtonHovered,
        focused && !disabled && styles.utilitySketchButtonFocused,
        pressed && !disabled && styles.utilitySketchButtonPressed,
        disabled && styles.utilitySketchButtonDisabled,
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      <View pointerEvents="none" style={styles.utilitySketchLineTopLeft} />
      <View pointerEvents="none" style={styles.utilitySketchLineTopRight} />
      <View pointerEvents="none" style={styles.utilitySketchLineBottomLeft} />
      <View pointerEvents="none" style={styles.utilitySketchLineBottomRight} />
      {iconName ? <MaterialIcons name={iconName} size={18} color={HOME_SECONDARY_BUTTON_TEXT} /> : null}
      <Text style={[styles.utilitySketchLabel, { fontFamily: usernameFontFamily }]}>
        {label}
      </Text>
    </Pressable>
  );

  const renderUtilityControl = () => {
    if (user?.provider === 'guest') {
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
      <View style={styles.topOverlayLeft}>
        {renderUtilityControl()}
        {renderIdentityLabel()}
      </View>
      {renderUtilityAction()}
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
    minHeight: 38,
  },
  utilitySpacer: {
    width: 88,
    height: 38,
  },
  utilitySketchButton: {
    minWidth: 92,
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: HOME_SECONDARY_BUTTON_BORDER,
    backgroundColor: HOME_SECONDARY_BUTTON_BACKGROUND,
    alignSelf: 'flex-start',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 28,
    borderBottomLeftRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    position: 'relative',
    transform: [{ rotate: HOME_UTILITY_BUTTON_ROTATION }],
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          transitionDuration: '235ms',
          transitionProperty: 'transform, box-shadow',
          userSelect: 'none',
          willChange: 'transform, box-shadow',
          borderTopLeftRadius: '255px 15px',
          borderTopRightRadius: '15px 225px',
          borderBottomRightRadius: '225px 15px',
          borderBottomLeftRadius: '15px 255px',
          boxShadow: [
            {
              color: 'rgba(0, 0, 0, 0.2)',
              offsetX: 15,
              offsetY: 28,
              blurRadius: 25,
              spreadDistance: -18,
            },
          ],
        }
      : {}),
  },
  utilitySketchButtonHovered: {
    transform: [{ rotate: HOME_UTILITY_BUTTON_ROTATION }, { translateY: 2 }],
    ...(Platform.OS === 'web'
      ? {
          boxShadow: [
            {
              color: 'rgba(0, 0, 0, 0.3)',
              offsetX: 2,
              offsetY: 8,
              blurRadius: 8,
              spreadDistance: -5,
            },
          ],
        }
      : {}),
  },
  utilitySketchButtonFocused: {
    ...(Platform.OS === 'web'
      ? {
          boxShadow: [
            {
              color: 'rgba(0, 0, 0, 0.3)',
              offsetX: 2,
              offsetY: 8,
              blurRadius: 4,
              spreadDistance: -6,
            },
          ],
        }
      : {}),
  },
  utilitySketchButtonPressed: {
    transform: [{ rotate: HOME_UTILITY_BUTTON_ROTATION }, { translateY: 3 }],
    ...(Platform.OS === 'web'
      ? {
          boxShadow: [
            {
              color: 'rgba(0, 0, 0, 0.22)',
              offsetX: 1,
              offsetY: 5,
              blurRadius: 5,
              spreadDistance: -5,
            },
          ],
        }
      : {}),
  },
  utilitySketchButtonDisabled: {
    opacity: 0.62,
  },
  utilitySketchLabel: {
    color: HOME_SECONDARY_BUTTON_TEXT,
    fontSize: 16,
    lineHeight: 18,
    textAlign: 'center',
    zIndex: 1,
  },
  utilityUsername: {
    color: '#FFF5DE',
    textShadowColor: 'rgba(72, 31, 10, 0.54)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
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
  utilitySketchLineTopLeft: {
    position: 'absolute',
    top: 7,
    left: 14,
    width: 18,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: HOME_SECONDARY_BUTTON_SKETCH,
    transform: [{ rotate: '-5deg' }],
  },
  utilitySketchLineTopRight: {
    position: 'absolute',
    top: 8,
    right: 16,
    width: 22,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: HOME_SECONDARY_BUTTON_SKETCH,
    transform: [{ rotate: '4deg' }],
  },
  utilitySketchLineBottomLeft: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    width: 20,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: HOME_SECONDARY_BUTTON_SKETCH,
    transform: [{ rotate: '3deg' }],
  },
  utilitySketchLineBottomRight: {
    position: 'absolute',
    right: 14,
    bottom: 7,
    width: 16,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: HOME_SECONDARY_BUTTON_SKETCH,
    transform: [{ rotate: '-6deg' }],
  },
});
