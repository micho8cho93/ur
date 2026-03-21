import { Button } from '@/components/ui/Button';
import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH, WideScreenBackground } from '@/components/ui/WideScreenBackground';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { GAME_MODE_CONFIGS, type MatchModeId } from '@/logic/matchConfigs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const homeWideBackground = require('../../assets/images/home_bg.png');
const homeMobileBackground = require('../../assets/images/home_bg_mobile.png');

const MODE_ICONS: Record<Exclude<MatchModeId, 'standard'>, keyof typeof MaterialIcons.glyphMap> = {
  gameMode_1_piece: 'looks-one',
  gameMode_3_pieces: 'filter-3',
  gameMode_5_pieces: 'filter-5',
  gameMode_full_path: 'timeline',
};

export default function GameModesScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const showWideBackground = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH;
  const showMobileBackground = useMobileBackground();
  const isCompactLayout = width < 820;

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
      <View style={styles.bottomShade} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Game Modes</Text>
          <Text style={styles.title}>Offline Practice Variants</Text>
        </View>

        <View style={[styles.gridList, isCompactLayout && styles.gridListCompact]}>
          {GAME_MODE_CONFIGS.map((config) => (
            <View key={config.modeId} style={[styles.card, isCompactLayout && styles.cardCompact]}>
              <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.cardTexture} />
              <View style={styles.cardBorder} />

              <View style={styles.cardHeader}>
                <View style={styles.iconWrap}>
                  <MaterialIcons
                    name={MODE_ICONS[config.modeId as Exclude<MatchModeId, 'standard'>]}
                    size={20}
                    color={urTheme.colors.goldBright}
                  />
                </View>
                <View style={styles.copyColumn}>
                  <Text style={styles.cardTitle}>{config.displayName}</Text>
                  <Text style={styles.cardSubtitle}>{config.selectionSubtitle}</Text>
                </View>
              </View>

              <Button
                title={`Choose ${config.displayName}`}
                onPress={() => router.push(`/(game)/bot?modeId=${config.modeId}`)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: urTheme.colors.night,
  },
  scrollContent: {
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.lg,
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
  },
  textureWide: {
    opacity: 0.12,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '32%',
    backgroundColor: 'rgba(180, 120, 30, 0.12)',
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '48%',
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
  },
  hero: {
    alignItems: 'center',
    marginBottom: urTheme.spacing.lg,
    paddingTop: urTheme.spacing.md,
  },
  eyebrow: {
    ...urTypography.label,
    color: urTheme.colors.parchment,
    fontSize: 11,
    marginBottom: urTheme.spacing.xs,
  },
  title: {
    ...urTypography.title,
    color: urTheme.colors.ivory,
    textAlign: 'center',
    fontSize: 34,
    lineHeight: 40,
    maxWidth: 520,
  },
  gridList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: urTheme.spacing.md,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  gridListCompact: {
    flexDirection: 'column',
  },
  card: {
    width: '48.5%',
    minHeight: 220,
    overflow: 'hidden',
    borderRadius: urTheme.radii.lg,
    borderWidth: 1.3,
    borderColor: 'rgba(217, 164, 65, 0.7)',
    backgroundColor: 'rgba(13, 15, 18, 0.66)',
    padding: urTheme.spacing.lg,
    ...boxShadow({
      color: '#000',
      opacity: 0.24,
      offset: { width: 0, height: 10 },
      blurRadius: 14,
      elevation: 8,
    }),
  },
  cardCompact: {
    width: '100%',
  },
  cardTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.14,
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 230, 181, 0.22)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: urTheme.spacing.sm,
    marginBottom: urTheme.spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.46)',
    backgroundColor: 'rgba(201, 152, 32, 0.14)',
  },
  copyColumn: {
    flex: 1,
  },
  cardTitle: {
    ...urTypography.title,
    color: urTheme.colors.ivory,
    fontSize: 24,
    lineHeight: 28,
  },
  cardSubtitle: {
    color: 'rgba(239, 224, 198, 0.84)',
    lineHeight: 21,
    marginTop: 2,
  },
});
