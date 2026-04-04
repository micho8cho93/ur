import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTypography } from '@/constants/urTheme';
import { EloImpactIndicator } from '@/components/elo/EloImpactIndicator';
import { EloRatingChangeNotificationPayload, EloRatingProfileRpcResponse } from '@/shared/elo';

interface EloMatchSummaryPanelProps {
  result: EloRatingChangeNotificationPayload | null;
  pending?: boolean;
  unchangedReason?: string | null;
  ratingProfile?: EloRatingProfileRpcResponse | null;
}

const formatDelta = (value: number): string => `${value >= 0 ? '+' : ''}${value}`;

export const EloMatchSummaryPanel: React.FC<EloMatchSummaryPanelProps> = ({
  result,
  pending = false,
  unchangedReason = null,
  ratingProfile = null,
}) => {
  const { width } = useWindowDimensions();
  const useCompactLayout = width < 420;

  if (result) {
    const isPositive = result.player.delta >= 0;

    return (
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Ranked Elo</Text>
        <View style={[styles.resultRow, useCompactLayout && styles.resultRowCompact]}>
          <View>
            <Text style={[styles.deltaValue, isPositive ? styles.deltaPositive : styles.deltaNegative]}>
              {formatDelta(result.player.delta)} Elo
            </Text>
            <View style={styles.ratingValueRow}>
              <Text style={styles.deltaMeta}>Rating {result.player.newRating}</Text>
              <EloImpactIndicator delta={result.player.delta} size={18} testID="elo-impact-indicator" />
            </View>
          </View>
          {result.player.provisional ? (
            <View style={styles.provisionalBadge}>
              <Text style={styles.provisionalBadgeText}>Provisional</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailChip}>
            <Text style={styles.detailLabel}>Record</Text>
            <Text style={styles.detailValue}>
              {result.player.ratedWins}-{result.player.ratedLosses}
            </Text>
          </View>
          <View style={styles.detailChip}>
            <Text style={styles.detailLabel}>Rated Games</Text>
            <Text style={styles.detailValue}>{result.player.ratedGames}</Text>
          </View>
          <View style={styles.detailChip}>
            <Text style={styles.detailLabel}>Opponent</Text>
            <Text style={styles.detailValue}>
              {result.opponent.usernameDisplay} {formatDelta(result.opponent.delta)}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (!pending && ratingProfile) {
    return (
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Ranked Elo</Text>
        <View style={[styles.resultRow, useCompactLayout && styles.resultRowCompact]}>
          <View>
            <Text style={styles.stateTitle}>Elo unchanged</Text>
            <View style={styles.ratingValueRow}>
              <Text style={styles.deltaMeta}>Rating {ratingProfile.eloRating}</Text>
              <EloImpactIndicator delta={0} size={18} testID="elo-impact-indicator" />
            </View>
          </View>
          {ratingProfile.provisional ? (
            <View style={styles.provisionalBadge}>
              <Text style={styles.provisionalBadgeText}>Provisional</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.stateText}>{unchangedReason ?? 'This match did not affect your Elo rating.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Ranked Elo</Text>
      <Text style={styles.stateTitle}>{pending ? 'Verifying result...' : 'Elo unchanged'}</Text>
      <Text style={styles.stateText}>
        {pending
          ? 'The server is confirming the final ranked result and updating both players now.'
          : unchangedReason ?? 'This match did not affect your Elo rating.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: urTheme.radii.md,
    padding: urTheme.spacing.md,
    gap: urTheme.spacing.sm,
    backgroundColor: 'rgba(16, 21, 28, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(236, 205, 152, 0.2)',
    ...boxShadow({
      color: '#000',
      opacity: 0.18,
      offset: { width: 0, height: 8 },
      blurRadius: 12,
      elevation: 4,
    }),
  },
  eyebrow: {
    ...urTypography.label,
    color: 'rgba(240, 224, 196, 0.68)',
    fontSize: 10,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
  },
  resultRowCompact: {
    flexWrap: 'wrap',
  },
  deltaValue: {
    ...urTypography.title,
    fontSize: 28,
    lineHeight: 32,
  },
  deltaPositive: {
    color: '#F0C040',
  },
  deltaNegative: {
    color: '#E8622E',
  },
  deltaMeta: {
    color: 'rgba(243, 230, 206, 0.78)',
    fontSize: 13,
    lineHeight: 18,
  },
  ratingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  provisionalBadge: {
    borderRadius: urTheme.radii.pill,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: 6,
    backgroundColor: 'rgba(29, 79, 140, 0.32)',
    borderWidth: 1,
    borderColor: 'rgba(140, 186, 255, 0.32)',
  },
  provisionalBadgeText: {
    ...urTypography.label,
    color: '#D7E9FF',
    fontSize: 10,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: urTheme.spacing.sm,
  },
  detailChip: {
    minWidth: 88,
    borderRadius: urTheme.radii.sm,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: urTheme.spacing.sm,
    backgroundColor: 'rgba(9, 14, 20, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(236, 205, 152, 0.14)',
  },
  detailLabel: {
    color: 'rgba(243, 230, 206, 0.58)',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 4,
  },
  detailValue: {
    ...urTypography.subtitle,
    color: '#F8ECD6',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
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
});
