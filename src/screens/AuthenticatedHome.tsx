import { FiveStepTutorialModal } from '@/components/FiveStepTutorialModal';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH, WideScreenBackground } from '@/components/ui/WideScreenBackground';
import { Button } from '@/components/ui/Button';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { useAuth } from '@/src/auth/useAuth';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const homeWideBackground = require('../../assets/images/home_bg.png');

export default function AuthenticatedHome() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showHowToPlay, setShowHowToPlay] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const showWideBackground = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH;
  const blackButtonLabel = styles.blackButtonLabel;

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
      <Image
        source={urTextures.woodDark}
        resizeMode="repeat"
        style={[styles.texture, showWideBackground && styles.textureWide]}
      />
      <View style={styles.topGlow} />
      <View style={styles.midGlow} />
      <View style={styles.bottomShade} />

      <View style={styles.authBar}>
        <View>
          <Text style={styles.authLabel}>Signed in as</Text>
          <Text style={styles.authValue}>Welcome {user?.username ?? 'Player'}</Text>
        </View>
        {user?.provider !== 'guest' ? (
          <Button
            title={isLoggingOut ? 'Logging out...' : 'Logout'}
            variant="outline"
            loading={isLoggingOut}
            disabled={isLoggingOut}
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        ) : null}
      </View>

      <View style={styles.hero}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Royal Archive</Text>
        </View>
        <Text style={styles.title}>Royal Game of Ur</Text>
        <Text style={styles.subtitle}>An ancient race across carved lanes, sacred rosettes, and dramatic turns.</Text>
      </View>

      <View style={styles.panel}>
        <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.panelTexture} />
        <View style={styles.panelBorder} />

        <View style={styles.buttonStack}>
          <Button
            title="Quick Play"
            onPress={() => router.push('/(game)/bot')}
            style={styles.quickPlayButton}
            labelStyle={blackButtonLabel}
          />
          <Button
            title="Play Online"
            variant="outline"
            onPress={() => router.push('/(game)/lobby?mode=online')}
            style={styles.playOnlineButton}
            labelStyle={blackButtonLabel}
          />
          <Button
            title="Watch Extended Tutorial"
            variant="outline"
            onPress={() => router.push('/tutorial/watch' as never)}
            style={styles.extendedTutorialButton}
            labelStyle={blackButtonLabel}
          />
          <Button title="5 Step Tutorial" variant="secondary" onPress={() => setShowHowToPlay(true)} />
        </View>
      </View>

      <FiveStepTutorialModal visible={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: urTheme.spacing.lg,
    backgroundColor: urTheme.colors.night,
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
  authBar: {
    position: 'absolute',
    top: urTheme.spacing.lg,
    left: urTheme.spacing.lg,
    right: urTheme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: urTheme.spacing.md,
    maxWidth: 720,
    alignSelf: 'center',
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
  logoutButton: {
    minWidth: 132,
  },
  hero: {
    alignItems: 'center',
    marginBottom: urTheme.spacing.xl + 10,
    maxWidth: 560,
  },
  badge: {
    paddingHorizontal: urTheme.spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(13, 15, 18, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.6)',
    marginBottom: urTheme.spacing.sm,
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
  subtitle: {
    marginTop: urTheme.spacing.sm,
    textAlign: 'center',
    color: 'rgba(239, 224, 198, 0.82)',
    fontSize: 17,
    lineHeight: 24,
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
  buttonStack: {
    gap: urTheme.spacing.sm,
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
  extendedTutorialButton: {
    backgroundColor: '#F3E9D2',
    borderColor: 'rgba(92, 73, 42, 0.2)',
    borderWidth: 1.2,
  },
  blackButtonLabel: {
    color: '#121212',
  },
});
