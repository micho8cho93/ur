import React from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { useProgression } from '@/src/progression/useProgression';
import { Button } from '../ui/Button';
import { ProgressionModal } from './ProgressionModal';
import { XpProgressBar } from './XpProgressBar';

interface ProgressionSummaryCardProps {
  style?: StyleProp<ViewStyle>;
}

export const ProgressionSummaryCard: React.FC<ProgressionSummaryCardProps> = ({ style }) => {
  const { progression, errorMessage, isLoading, isRefreshing, refresh } = useProgression();
  const [showModal, setShowModal] = React.useState(false);

  return (
    <>
      <View style={[styles.card, style]}>
        <Image source={urTextures.lapisMosaic} resizeMode="repeat" style={styles.texture} />
        <View style={styles.cardGlow} />
        <View style={styles.cardBorder} />

        <Text style={styles.eyebrow}>Rank & XP</Text>

        {progression ? (
          <XpProgressBar
            snapshot={progression}
            compact
            showInfoButton
            onInfoPress={() => setShowModal(true)}
          />
        ) : isLoading ? (
          <View style={styles.stateBlock}>
            <Text style={styles.stateTitle}>Inscribing your record...</Text>
            <Text style={styles.stateText}>Fetching your latest XP and rank from the royal archive.</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateBlock}>
            <Text style={styles.stateTitle}>Progression unavailable</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Button
              title="Retry"
              variant="outline"
              onPress={() => {
                void refresh();
              }}
              style={styles.retryButton}
            />
          </View>
        ) : (
          <View style={styles.stateBlock}>
            <Text style={styles.stateTitle}>No progression recorded yet</Text>
            <Text style={styles.stateText}>Your XP and rank will appear here once the server record is available.</Text>
          </View>
        )}

        {progression && isRefreshing ? (
          <Text style={styles.metaText}>Refreshing your latest progression...</Text>
        ) : null}
        {progression && errorMessage && !isRefreshing ? (
          <Text style={styles.metaText}>Showing your most recently synced progression.</Text>
        ) : null}
      </View>

      <ProgressionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        progression={progression}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: urTheme.radii.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 16, 24, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(236, 205, 152, 0.24)',
    padding: urTheme.spacing.md,
    gap: urTheme.spacing.sm,
    ...boxShadow({
      color: '#000',
      opacity: 0.16,
      offset: { width: 0, height: 8 },
      blurRadius: 14,
      elevation: 6,
    }),
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(90, 144, 220, 0.12)',
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(248, 230, 192, 0.12)',
  },
  eyebrow: {
    ...urTypography.label,
    color: 'rgba(240, 224, 196, 0.68)',
    fontSize: 10,
  },
  stateBlock: {
    gap: 6,
  },
  stateTitle: {
    ...urTypography.subtitle,
    color: '#F8ECD6',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  stateText: {
    color: 'rgba(243, 230, 206, 0.78)',
    fontSize: 13,
    lineHeight: 19,
  },
  retryButton: {
    marginTop: urTheme.spacing.xs,
    alignSelf: 'flex-start',
    minWidth: 120,
  },
  metaText: {
    color: 'rgba(236, 223, 197, 0.62)',
    fontSize: 12,
    lineHeight: 17,
  },
});
