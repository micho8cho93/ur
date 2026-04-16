import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH, WideScreenBackground } from '@/components/ui/WideScreenBackground';
import { boxShadow } from '@/constants/styleEffects';
import { urTextColors, urTheme } from '@/constants/urTheme';
import { useAuth } from '@/src/auth/useAuth';
import { HOME_GROBOLD_FONT_FAMILY } from '@/src/home/homeTheme';
import { CTA_BUTTON_VISIBLE_IMAGE_STYLE } from '@/components/ui/buttonArt';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  ImageStyle,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PendingAction = 'guest' | 'google' | null;
type ButtonVariant = 'light' | 'cta';

const BUTTON_PANEL_ASPECT_RATIO = 1214 / 536;
const DESKTOP_BACKGROUND = require('../../assets/images/bg_login.png');
const MOBILE_BACKGROUND = require('../../assets/images/bg_login_mobile.png');
const BUTTON_PANEL_ART = require('../../assets/images/login_large_panel_trimmed.png');
const LOGO_ART = require('../../assets/images/login_logo_legacy.png');
const LIGHT_BUTTON_ART = require('../../assets/buttons/button_light_cropped.png');
const CTA_BUTTON_ART = require('../../assets/buttons/cta_button.png');

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};

type LoginActionButtonProps = {
  title: string;
  onPress: () => Promise<void>;
  disabled: boolean;
  loading: boolean;
  width: number;
  compact: boolean;
  mobileWeb?: boolean;
  accessibilityLabel: string;
  variant: ButtonVariant;
};

function LoginActionButton({
  title,
  onPress,
  disabled,
  loading,
  width,
  compact,
  mobileWeb = false,
  accessibilityLabel,
  variant,
}: LoginActionButtonProps) {
  const labelColor = variant === 'light' ? urTextColors.buttonOnStone : urTheme.colors.ivory;
  const actionButtonHeight = mobileWeb ? 45 : compact ? 56 : 66;
  const actionButtonCornerRadius = Math.max(12, Math.round(actionButtonHeight * 0.34));
  const textStyle = [
    styles.actionLabel,
    compact ? styles.actionLabelCompact : styles.actionLabelRegular,
    mobileWeb && styles.actionLabelMobileWeb,
    styles.actionLabelGrobold,
    variant === 'light' ? styles.actionLabelLight : styles.actionLabelCta,
    { color: labelColor },
    disabled && styles.actionLabelDisabled,
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => {
        void onPress();
      }}
      style={({ pressed }) => [
        styles.actionButton,
        compact ? styles.actionButtonCompact : styles.actionButtonRegular,
        mobileWeb && styles.actionButtonMobileWeb,
        {
          width,
          borderRadius: actionButtonCornerRadius,
        },
        pressed && !disabled && styles.actionButtonPressed,
        disabled && styles.actionButtonDisabled,
      ]}
    >
      {({ pressed }) => (
        <ImageBackground
          source={variant === 'light' ? LIGHT_BUTTON_ART : CTA_BUTTON_ART}
          resizeMode="stretch"
          style={[
            styles.actionButtonFrame,
            variant === 'light' ? styles.actionButtonFrameLight : styles.actionButtonFrameCta,
            {
              borderRadius: actionButtonCornerRadius,
              overflow: 'hidden',
            },
          ]}
          imageStyle={[
            styles.actionButtonImage,
            variant === 'cta' ? styles.actionButtonImageCta : null,
            {
              borderRadius: actionButtonCornerRadius,
            },
            pressed ? styles.actionButtonImagePressed : null,
            disabled ? styles.actionButtonImageDisabled : null,
          ]}
        >
          {loading ? (
            <View style={styles.actionButtonLoading}>
              <ActivityIndicator color={labelColor} size="small" />
              <Text style={textStyle}>{title}</Text>
            </View>
          ) : (
            <Text numberOfLines={1} style={textStyle}>
              {title}
            </Text>
          )}
        </ImageBackground>
      )}
    </Pressable>
  );
}

export default function LoginScreen() {
  const { loginAsGuest, loginWithGoogle } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const showWideBackground = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH;
  const showMobileBackground = useMobileBackground();
  const isCompactLayout = width < 760;
  const isWeb = Platform.OS === 'web';
  const isDesktopWeb = isWeb && !isCompactLayout;
  const isMobileWeb = isWeb && isCompactLayout;
  const buttonPanelWidth = Math.min(width - (isCompactLayout ? 28 : 72), isCompactLayout ? 392 : 600);
  const baseButtonWidth = Math.min(buttonPanelWidth * (isCompactLayout ? 0.72 : 0.68), isCompactLayout ? 280 : 420);
  const buttonWidth = isMobileWeb ? Math.round(baseButtonWidth * 0.8) : baseButtonWidth;
  const logoWidth = showWideBackground
    ? Math.min(width * 0.27, height * 0.43, 420)
    : Math.min(width * (isCompactLayout ? 0.62 : 0.28), isCompactLayout ? 250 : 340);
  const panelArtStyle = isMobileWeb
    ? styles.buttonPanelArtMobileWeb
    : isWeb
      ? styles.buttonPanelArtWeb
      : styles.buttonPanelArt;
  const buttonPanelInnerStyle = [
    styles.buttonPanelInner,
    isCompactLayout && styles.buttonPanelInnerCompact,
    isMobileWeb && styles.buttonPanelInnerMobileWeb,
  ];
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
      <WideScreenBackground
        source={DESKTOP_BACKGROUND}
        visible={showWideBackground}
        overlayColor="rgba(32, 20, 7, 0.16)"
      />
      <MobileBackground
        source={MOBILE_BACKGROUND}
        visible={showMobileBackground}
        overlayColor="rgba(35, 21, 8, 0.12)"
      />
      <View style={styles.skyGlow} />
      <View style={styles.horizonGlow} />
      <View style={styles.bottomShade} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            minHeight: height,
            paddingTop: insets.top + (isMobileWeb ? 26 : isDesktopWeb ? 18 : 36),
            paddingBottom: insets.bottom + (isCompactLayout ? 24 : 32),
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.content}>
          <Image
            source={LOGO_ART}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="UR Legacy"
            style={[
              styles.logo as ImageStyle,
              isDesktopWeb && (styles.logoDesktopWeb as ImageStyle),
              { width: logoWidth, height: logoWidth * 0.88 },
            ]}
          />

          <View style={[styles.buttonColumn, isCompactLayout && styles.buttonColumnCompact]}>
            <ImageBackground
              accessible={false}
              source={BUTTON_PANEL_ART}
              resizeMode="contain"
              imageStyle={panelArtStyle}
              style={[styles.buttonPanel, { width: buttonPanelWidth }]}
            >
              <View style={buttonPanelInnerStyle}>
                <LoginActionButton
                  title="Sign In As Guest"
                  accessibilityLabel="Sign in as guest"
                  onPress={handleGuestLogin}
                  disabled={pendingAction !== null}
                  loading={pendingAction === 'guest'}
                  width={buttonWidth}
                  compact={isCompactLayout}
                  mobileWeb={isMobileWeb}
                  variant="light"
                />
                <LoginActionButton
                  title="Sign In With Google"
                  accessibilityLabel="Sign in with Google"
                  onPress={handleGoogleLogin}
                  disabled={pendingAction !== null}
                  loading={pendingAction === 'google'}
                  width={buttonWidth}
                  compact={isCompactLayout}
                  mobileWeb={isMobileWeb}
                  variant="cta"
                />
              </View>
            </ImageBackground>
          </View>

          <View style={styles.footerCopy}>
            {Platform.OS !== 'web' ? (
              <Text style={[styles.supportText, styles.platformNote, isCompactLayout && styles.supportTextCompact]}>
                Native Google sign-in still needs platform client configuration.
              </Text>
            ) : null}
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#201206',
  },
  scrollView: {
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: urTheme.spacing.md,
  },
  content: {
    width: '100%',
    maxWidth: 620,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: urTheme.spacing.md,
  },
  skyGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '28%',
    backgroundColor: 'rgba(86, 151, 234, 0.1)',
  },
  horizonGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '22%',
    height: '28%',
    backgroundColor: 'rgba(255, 216, 142, 0.08)',
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '34%',
    backgroundColor: 'rgba(28, 15, 6, 0.2)',
  },
  logo: {
    marginTop: urTheme.spacing.xs,
    ...boxShadow({
      color: '#2B1203',
      opacity: 0.38,
      offset: { width: 0, height: 14 },
      blurRadius: 22,
      elevation: 10,
    }),
  },
  logoDesktopWeb: {
    marginTop: -40,
  },
  buttonColumn: {
    width: '100%',
    alignItems: 'center',
    marginTop: urTheme.spacing.sm,
  },
  buttonColumnCompact: {
    marginTop: urTheme.spacing.xs,
  },
  buttonPanel: {
    aspectRatio: BUTTON_PANEL_ASPECT_RATIO,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPanelArt: {
    resizeMode: 'contain',
    transform: [{ translateY: -20 }],
  },
  buttonPanelArtWeb: {
    transform: [{ translateY: -132 }],
  },
  buttonPanelArtMobileWeb: {
    transform: [{ translateY: -46 }],
  },
  buttonPanelInner: {
    width: '80%',
    height: '64%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: urTheme.spacing.sm,
  },
  buttonPanelInnerCompact: {
    width: '82%',
    height: '70%',
    gap: urTheme.spacing.xs,
  },
  buttonPanelInnerMobileWeb: {
    transform: [{ translateY: 133 }],
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonRegular: {
    height: 66,
  },
  actionButtonCompact: {
    height: 56,
  },
  actionButtonMobileWeb: {
    height: 45,
  },
  actionButtonPressed: {
    transform: [{ scale: 0.985 }],
  },
  actionButtonDisabled: {
    opacity: 0.68,
  },
  actionButtonFrame: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonFrameLight: {
    paddingHorizontal: urTheme.spacing.md,
  },
  actionButtonFrameCta: {
    paddingHorizontal: urTheme.spacing.md,
    paddingTop: 6,
    paddingBottom: 8,
  },
  actionButtonImage: {
    width: '100%',
    height: '100%',
  },
  actionButtonImageCta: {
    ...CTA_BUTTON_VISIBLE_IMAGE_STYLE,
  },
  actionButtonImagePressed: {
    opacity: 0.97,
  },
  actionButtonImageDisabled: {
    opacity: 0.62,
  },
  actionButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '96%',
  },
  actionLabel: {
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    width: '96%',
  },
  actionLabelLight: {
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionLabelCta: {
    textShadowColor: 'rgba(86, 42, 0, 0.42)',
  },
  actionLabelRegular: {
    fontSize: 18,
  },
  actionLabelCompact: {
    fontSize: 13,
  },
  actionLabelMobileWeb: {
    fontSize: 11,
  },
  actionLabelGrobold: {
    fontFamily: HOME_GROBOLD_FONT_FAMILY,
    letterSpacing: 0.8,
  },
  actionLabelDisabled: {
    opacity: 0.72,
  },
  footerCopy: {
    width: '100%',
    maxWidth: 420,
    minHeight: 22,
    marginTop: urTheme.spacing.xs,
    paddingHorizontal: urTheme.spacing.md,
  },
  supportText: {
    color: 'rgba(255, 244, 226, 0.92)',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 14,
  },
  supportTextCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  platformNote: {
    color: 'rgba(255, 235, 208, 0.76)',
  },
  errorText: {
    marginTop: urTheme.spacing.sm,
    color: '#FFE0D7',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '700',
  },
});
