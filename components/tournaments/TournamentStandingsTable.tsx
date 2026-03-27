import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { formatTournamentDateTime } from '@/src/tournaments/presentation';
import type { PublicTournamentStanding } from '@/src/tournaments/types';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

type TournamentStandingsTableProps = {
  entries: PublicTournamentStanding[];
  emptyMessage: string;
};

const COLUMNS = [
  { key: 'rank', label: 'Rank', width: 68 },
  { key: 'player', label: 'Player', width: 190 },
  { key: 'score', label: 'Score', width: 90 },
  { key: 'subscore', label: 'Tiebreak', width: 96 },
  { key: 'writes', label: 'Writes', width: 90 },
  { key: 'updated', label: 'Updated', width: 170 },
] as const;

export const TournamentStandingsTable: React.FC<TournamentStandingsTableProps> = ({
  entries,
  emptyMessage,
}) => {
  if (entries.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.texture} />
      <View style={styles.border} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View>
          <View style={styles.headerRow}>
            {COLUMNS.map((column) => (
              <Text key={column.key} style={[styles.headerCell, { width: column.width }]}>
                {column.label}
              </Text>
            ))}
          </View>

          {entries.map((entry) => (
            <View key={`${entry.ownerId}-${entry.rank ?? 'na'}`} style={styles.bodyRow}>
              <Text style={[styles.bodyCell, styles.rankCell, { width: COLUMNS[0].width }]}>{entry.rank ?? '-'}</Text>
              <View style={[styles.playerCellWrap, { width: COLUMNS[1].width }]}>
                <Text numberOfLines={1} style={[styles.bodyCell, styles.playerName]}>
                  {entry.username}
                </Text>
                <Text numberOfLines={1} style={styles.playerMeta}>
                  {entry.ownerId}
                </Text>
              </View>
              <Text style={[styles.bodyCell, { width: COLUMNS[2].width }]}>{entry.score}</Text>
              <Text style={[styles.bodyCell, { width: COLUMNS[3].width }]}>{entry.subscore}</Text>
              <Text style={[styles.bodyCell, { width: COLUMNS[4].width }]}>
                {entry.attempts ?? 0}
                {entry.maxAttempts ? ` / ${entry.maxAttempts}` : ''}
              </Text>
              <Text numberOfLines={1} style={[styles.bodyCell, { width: COLUMNS[5].width }]}>
                {formatTournamentDateTime(entry.updatedAt)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    position: 'relative',
    borderRadius: urTheme.radii.lg,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(217, 164, 65, 0.52)',
    backgroundColor: 'rgba(13, 15, 18, 0.58)',
    ...boxShadow({
      color: '#000',
      opacity: 0.22,
      offset: { width: 0, height: 8 },
      blurRadius: 12,
      elevation: 6,
    }),
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 231, 192, 0.16)',
  },
  scrollContent: {
    padding: urTheme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    paddingBottom: urTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(247, 229, 203, 0.18)',
  },
  headerCell: {
    ...urTypography.label,
    color: 'rgba(216, 232, 251, 0.82)',
    fontSize: 10,
    paddingRight: urTheme.spacing.sm,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(247, 229, 203, 0.12)',
  },
  bodyCell: {
    color: urTheme.colors.shell,
    paddingRight: urTheme.spacing.sm,
    paddingVertical: urTheme.spacing.sm,
  },
  rankCell: {
    fontWeight: '700',
    color: urTheme.colors.parchment,
  },
  playerCellWrap: {
    paddingRight: urTheme.spacing.sm,
    paddingVertical: urTheme.spacing.sm,
  },
  playerName: {
    paddingVertical: 0,
    fontWeight: '700',
  },
  playerMeta: {
    color: 'rgba(216, 232, 251, 0.62)',
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(247, 229, 203, 0.16)',
    backgroundColor: 'rgba(247, 229, 203, 0.05)',
    padding: urTheme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: 'rgba(238, 223, 197, 0.82)',
    textAlign: 'center',
    lineHeight: 21,
  },
});
