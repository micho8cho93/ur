import { Button } from '@/components/ui/Button';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { useAuth } from '@/src/auth/useAuth';
import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

type PendingAction = 'guest' | 'google' | null;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};

export default function LoginScreen() {
  const { loginAsGuest, loginWithGoogle } = useAuth();
  const [pendingAction, setPendingAction] = React.useState<PendingAction>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleGuestLogin = async () => {
    setPendingAction('guest');
    setErrorMessage(null);

    try {
      await loginAsGuest();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  const handleGoogleLogin = async () => {
    setPendingAction('google');
    setErrorMessage(null);

    try {
      await loginWithGoogle();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <View style={styles.screen}>
      <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.texture} />
      <View style={styles.topGlow} />
      <View style={styles.bottomShade} />

      <View style={styles.card}>
        <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.cardTexture} />
        <View style={styles.cardBorder} />

        <Text style={styles.eyebrow}>Authentication</Text>
        <Text style={styles.title}>Enter The Royal Court</Text>
        <Text style={styles.subtitle}>
          Continue as a guest for instant play, or sign in with Google so your identity is ready for future online account linking.
        </Text>

        <View style={styles.buttonStack}>
          <Button
            title="Continue as Guest"
            variant="secondary"
            loading={pendingAction === 'guest'}
            disabled={pendingAction !== null}
            onPress={handleGuestLogin}
          />
          <Button
            title="Sign in with Google"
            loading={pendingAction === 'google'}
            disabled={pendingAction !== null}
            onPress={handleGoogleLogin}
          />
          <Button
            title="Sign up with Google"
            variant="outline"
            disabled={pendingAction !== null}
            onPress={handleGoogleLogin}
          />
        </View>

        <Text style={styles.helperText}>
          {Platform.OS === 'web'
            ? 'Google sign-in is available on web today.'
            : 'Google sign-in will be enabled on native once platform client IDs and a development build are configured.'}
        </Text>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: urTheme.spacing.lg,
    backgroundColor: urTheme.colors.night,
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.32,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '34%',
    backgroundColor: 'rgba(180, 120, 30, 0.12)',
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1.4,
    borderColor: 'rgba(217, 164, 65, 0.72)',
    padding: urTheme.spacing.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(13, 15, 18, 0.68)',
    ...boxShadow({
      color: '#000',
      opacity: 0.28,
      offset: { width: 0, height: 12 },
      blurRadius: 16,
      elevation: 10,
    }),
  },
  cardTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 231, 192, 0.24)',
  },
  eyebrow: {
    ...urTypography.label,
    fontSize: 11,
    color: urTheme.colors.parchment,
    marginBottom: urTheme.spacing.xs,
    textAlign: 'center',
  },
  title: {
    ...urTypography.title,
    color: urTheme.colors.ivory,
    textAlign: 'center',
    fontSize: 34,
    lineHeight: 40,
  },
  subtitle: {
    color: 'rgba(239, 224, 198, 0.82)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: urTheme.spacing.sm,
    marginBottom: urTheme.spacing.lg,
  },
  buttonStack: {
    gap: urTheme.spacing.sm,
  },
  helperText: {
    marginTop: urTheme.spacing.md,
    color: 'rgba(239, 224, 198, 0.66)',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    marginTop: urTheme.spacing.sm,
    textAlign: 'center',
    color: '#F6AAA2',
    lineHeight: 20,
  },
});
