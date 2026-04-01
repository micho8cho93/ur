import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH, WideScreenBackground } from '@/components/ui/WideScreenBackground';
import { Button } from '@/components/ui/Button';
import { ChallengeSummaryCard } from '@/components/challenges/ChallengeSummaryCard';
import { EloRatingSummaryCard } from '@/components/elo/EloRatingSummaryCard';
import { ProgressionSummaryCard } from '@/components/progression/ProgressionSummaryCard';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { useAuth } from '@/src/auth/useAuth';
import { useScreenTransition } from '@/src/transitions/ScreenTransitionContext';
import { useRouter } from 'expo-router';
import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const homeWideBackground = require('../../assets/images/home_bg.png');
const homeMobileBackground = require('../../assets/images/home_bg_mobile.png');

export default function AuthenticatedHome() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const runScreenTransition = useScreenTransition();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const showWideBackground = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH;
  const showMobileBackground = useMobileBackground();
  const isCompactLayout = width < 760;
  const useWideWebMenuLayout = Platform.OS === 'web' && !isCompactLayout;
  const showInlineGuestBackButton = user?.provider === 'guest' && isCompactLayout;
  const blackButtonLabel = styles.blackButtonLabel;

  // Dynamic top padding for compact layout: safe area + space to clear the authBar/backButton
  const compactTopPadding = isCompactLayout ? insets.top + 66 : undefined;
  // Dynamic authBar/backButton top position: just below the status bar
  const compactAbsoluteTop = isCompactLayout ? insets.top + urTheme.spacing.sm : undefined;

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={styles.screen}>
      <WideScreenBackground
        source={homeWideBackground}
        visible={showWideBackground}
        overlayColor="rgba(7, 10, 15, 0.18)"
      />
      <MobileBackground
        source={homeMobileBackground}
        visible={showMobileBackground}
        overlayColor="rgba(7, 10, 15, 0.18)"
      />
      <Image
        source={urTextures.woodDark}
        resizeMode="repeat"
        style={[styles.texture, showWideBackground && styles.textureWide]}
      />
      <View style={styles.topGlow} />
      <View style={styles.midGlow} />
      <View style={styles.bottomShade} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isCompactLayout && styles.scrollContentCompact,
          compactTopPadding != null && { paddingTop: compactTopPadding },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {user?.provider === 'guest' && !showInlineGuestBackButton ? (
          <Pressable
            onPress={async () => {
              await logout();
              router.replace('/(auth)/login');
            }}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
              compactAbsoluteTop != null && { top: compactAbsoluteTop },
            ]}
            accessibilityLabel="Back to login"
          >
            <MaterialIcons name="arrow-back" size={22} color="#F7E9D2" />
          </Pressable>
        ) : user?.provider !== 'guest' ? (
          <View style={[styles.authBar, isCompactLayout && styles.authBarCompact, compactAbsoluteTop != null && { top: compactAbsoluteTop }]}>
            <View>
              <Text style={styles.authLabel}>Signed in as</Text>
              <Text style={[styles.authValue, isCompactLayout && styles.authValueCompact]}>
                {user?.username ?? 'Player'}
              </Text>
            </View>
            <Button
              title={isLoggingOut ? 'Logging out...' : 'Logout'}
              variant="outline"
              loading={isLoggingOut}
              disabled={isLoggingOut}
              onPress={handleLogout}
              style={[styles.logoutButton, isCompactLayout && styles.logoutButtonCompact]}
            />
          </View>
        ) : null}

        <View style={[styles.hero, isCompactLayout && styles.heroCompact]}>
          <View style={[styles.heroBadgeRow, isCompactLayout && styles.heroBadgeRowCompact]}>
            {showInlineGuestBackButton ? (
              <Pressable
                onPress={async () => {
                  await logout();
                  router.replace('/(auth)/login');
                }}
                style={({ pressed }) => [styles.backButton, styles.heroBackButton, pressed && styles.backButtonPressed]}
                accessibilityLabel="Back to login"
              >
                <MaterialIcons name="arrow-back" size={22} color="#F7E9D2" />
              </Pressable>
            ) : null}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Royal Archive</Text>
            </View>
          </View>
          <Text style={[styles.title, isCompactLayout && styles.titleCompact]}>Royal Game of Ur</Text>
          <Text style={[styles.subtitle, isCompactLayout && styles.subtitleCompact]}>
            An ancient race across carved lanes, sacred rosettes, and dramatic turns.
          </Text>
        </View>

        <View style={[styles.panel, isCompactLayout && styles.panelCompact, useWideWebMenuLayout && styles.panelWide]}>
          <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.panelTexture} />
          <View style={styles.panelBorder} />

          <View
            style={[
              styles.summaryGrid,
              isCompactLayout && styles.summaryGridCompact,
              useWideWebMenuLayout && styles.summaryGridWide,
            ]}
          >
            <ProgressionSummaryCard
              style={[
                styles.summaryCard,
                useWideWebMenuLayout && styles.summaryCardWide,
              ]}
            />
            <EloRatingSummaryCard
              style={[
                styles.summaryCard,
                useWideWebMenuLayout && styles.summaryCardWide,
              ]}
            />
            <ChallengeSummaryCard
              style={[
                styles.summaryCard,
                useWideWebMenuLayout && styles.summaryCardWide,
              ]}
            />
          </View>

          <View
            style={[
              styles.buttonGrid,
              isCompactLayout && styles.buttonGridCompact,
              useWideWebMenuLayout && styles.buttonGridWide,
            ]}
          >
            <View style={[styles.buttonCell, useWideWebMenuLayout && styles.buttonCellWide]}>
              <Button
                title="Quick Play"
                onPress={() => router.push('/(game)/game-modes')}
                style={[styles.actionButton, styles.quickPlayButton]}
                labelStyle={blackButtonLabel}
              />
            </View>
            <View style={[styles.buttonCell, useWideWebMenuLayout && styles.buttonCellWide]}>
              <Button
                title="Play Online"
                variant="outline"
                onPress={() => router.push('/(game)/lobby?mode=online')}
                style={[styles.actionButton, styles.playOnlineButton]}
                labelStyle={blackButtonLabel}
              />
            </View>
            <View style={[styles.buttonCell, useWideWebMenuLayout && styles.buttonCellWide]}>
              <Button
                title="Leaderboard"
                variant="outline"
                onPress={() => router.push('/leaderboard')}
                style={[styles.actionButton, styles.leaderboardButton]}
                labelStyle={blackButtonLabel}
              />
            </View>
            <View style={[styles.buttonCell, useWideWebMenuLayout && styles.buttonCellWide]}>
              <Button
                title="Play Tutorial"
                variant="outline"
                onPress={() => {
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
                }}
                style={[styles.actionButton, styles.extendedTutorialButton]}
                labelStyle={blackButtonLabel}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: urTheme.colors.night,
  },
  scrollView: {
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: urTheme.spacing.lg,
    paddingVertical: urTheme.spacing.xl + urTheme.spacing.md,
  },
  scrollContentCompact: {
    paddingHorizontal: urTheme.spacing.md,
    paddingTop: urTheme.spacing.xl + urTheme.spacing.lg,
    paddingBottom: urTheme.spacing.lg,
    justifyContent: 'flex-start',
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  textureWide: {
    opacity: 0.1,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '28%',
    backgroundColor: 'rgba(180, 120, 30, 0.14)',
  },
  midGlow: {
    position: 'absolute',
    top: '34%',
    left: 0,
    right: 0,
    height: '22%',
    backgroundColor: 'rgba(140, 80, 20, 0.12)',
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '48%',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  backButton: {
    position: 'absolute',
    top: urTheme.spacing.lg,
    left: urTheme.spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 15, 18, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBackButton: {
    top: 0,
    left: 0,
  },
  backButtonPressed: {
    backgroundColor: 'rgba(217, 164, 65, 0.18)',
  },
  authBar: {
    position: 'absolute',
    top: urTheme.spacing.lg,
    left: urTheme.spacing.lg,
    right: urTheme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: urTheme.spacing.md,
  },
  authBarCompact: {
    top: urTheme.spacing.sm,
    left: urTheme.spacing.md,
    right: urTheme.spacing.md,
    gap: urTheme.spacing.sm,
  },
  authLabel: {
    ...urTypography.label,
    color: 'rgba(239, 224, 198, 0.72)',
    fontSize: 11,
  },
  authValue: {
    ...urTypography.title,
    color: '#F7E9D2',
    fontSize: 22,
    lineHeight: 28,
  },
  authValueCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
  logoutButton: {
    minWidth: 132,
  },
  logoutButtonCompact: {
    minWidth: 104,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    marginBottom: urTheme.spacing.xl + 10,
    maxWidth: 560,
  },
  heroCompact: {
    marginBottom: urTheme.spacing.sm,
    maxWidth: 440,
  },
  heroBadgeRow: {
    width: '100%',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: urTheme.spacing.sm,
  },
  heroBadgeRowCompact: {
    minHeight: 34,
    marginBottom: urTheme.spacing.xs,
  },
  badge: {
    paddingHorizontal: urTheme.spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(13, 15, 18, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.6)',
  },
  badgeText: {
    ...urTypography.label,
    fontSize: 10,
    color: urTheme.colors.parchment,
  },
  title: {
    ...urTypography.title,
    fontSize: 46,
    lineHeight: 56,
    color: '#F7E9D2',
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 30,
    lineHeight: 36,
  },
  subtitle: {
    marginTop: urTheme.spacing.sm,
    textAlign: 'center',
    color: 'rgba(239, 224, 198, 0.82)',
    fontSize: 17,
    lineHeight: 24,
  },
  subtitleCompact: {
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 390,
  },
  panel: {
    width: '100%',
    maxWidth: 460,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 164, 65, 0.74)',
    overflow: 'hidden',
    backgroundColor: 'rgba(13, 15, 18, 0.62)',
    padding: urTheme.spacing.lg,
    ...boxShadow({
      color: '#000',
      opacity: 0.28,
      offset: { width: 0, height: 10 },
      blurRadius: 14,
      elevation: 10,
    }),
  },
  panelCompact: {
    maxWidth: 420,
    padding: urTheme.spacing.sm + 2,
  },
  panelWide: {
    maxWidth: 980,
  },
  panelTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
  },
  panelBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 230, 181, 0.24)',
  },
  summaryGrid: {
    gap: urTheme.spacing.md,
    marginBottom: urTheme.spacing.md,
  },
  summaryGridCompact: {
    gap: urTheme.spacing.sm,
    marginBottom: urTheme.spacing.sm,
  },
  summaryGridWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  summaryCard: {
    minWidth: 0,
  },
  summaryCardWide: {
    flex: 1,
  },
  buttonGrid: {
    gap: urTheme.spacing.sm,
  },
  buttonGridCompact: {
    gap: urTheme.spacing.xs,
  },
  buttonGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: urTheme.spacing.sm,
    columnGap: urTheme.spacing.sm,
  },
  buttonCell: {
    width: '100%',
  },
  buttonCellWide: {
    width: '48.5%',
  },
  actionButton: {
    width: '100%',
  },
  quickPlayButton: {
    backgroundColor: '#D9CCB1',
    borderColor: 'rgba(92, 73, 42, 0.24)',
    borderWidth: 1.2,
  },
  playOnlineButton: {
    backgroundColor: '#B28A3C',
    borderColor: 'rgba(61, 41, 14, 0.38)',
    borderWidth: 1.2,
  },
  leaderboardButton: {
    backgroundColor: '#E2D3AF',
    borderColor: 'rgba(92, 73, 42, 0.24)',
    borderWidth: 1.2,
  },
  extendedTutorialButton: {
    backgroundColor: '#F3E9D2',
    borderColor: 'rgba(92, 73, 42, 0.2)',
    borderWidth: 1.2,
  },
  blackButtonLabel: {
    color: '#121212',
  },
});
