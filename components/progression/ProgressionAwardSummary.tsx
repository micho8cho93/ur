import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { urTheme, urTypography } from '@/constants/urTheme';
import type { ProgressionAwardResponse, ProgressionSnapshot } from '@/shared/progression';
import {
  formatProgressionXp,
  getProgressionDisplayTitle,
} from '@/src/progression/progressionDisplay';
import { XpProgressBar } from './XpProgressBar';

interface ProgressionAwardSummaryProps {
  progression: ProgressionSnapshot | null;
  award: ProgressionAwardResponse | null;
  pending?: boolean;
}

export const ProgressionAwardSummary: React.FC<ProgressionAwardSummaryProps> = ({
  progression,
  award,
  pending = false,
}) => {
  if (!progression && !pending) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>
          {award ? `Victory award: +${formatProgressionXp(award.awardedXp)} XP` : 'Recording victory XP...'}
        </Text>
        {award?.rankChanged ? (
          <View style={styles.rankUpPill}>
            <Text style={styles.rankUpPillText}>Rank Up</Text>
          </View>
        ) : null}
      </View>

      {progression ? <XpProgressBar snapshot={progression} award={award} compact /> : null}

      {award?.rankChanged ? (
        <Text style={styles.rankUpText}>
          New title unlocked: {getProgressionDisplayTitle(award.newRank) ?? award.newRank}
        </Text>
      ) : pending ? (
        <Text style={styles.pendingText}>The server is finalizing your updated record.</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: urTheme.spacing.sm,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(236, 205, 152, 0.18)',
    backgroundColor: 'rgba(12, 20, 31, 0.34)',
    padding: urTheme.spacing.md,
    gap: urTheme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: urTheme.spacing.sm,
  },
  headerLabel: {
    ...urTypography.label,
    flex: 1,
    color: '#F4D9A8',
    fontSize: 10,
  },
  rankUpPill: {
    borderRadius: urTheme.radii.pill,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: 5,
    backgroundColor: 'rgba(176, 105, 28, 0.34)',
    borderWidth: 1,
    borderColor: 'rgba(245, 205, 136, 0.3)',
  },
  rankUpPillText: {
    ...urTypography.label,
    color: '#F9E8C9',
    fontSize: 10,
  },
  rankUpText: {
    color: '#F8ECD6',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  pendingText: {
    color: 'rgba(243, 230, 206, 0.72)',
    fontSize: 12,
    lineHeight: 17,
  },
});
