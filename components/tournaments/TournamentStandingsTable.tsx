import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { formatTournamentDateTime } from '@/src/tournaments/presentation';
import type { PublicTournamentStanding } from '@/src/tournaments/types';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

type TournamentStandingsTableProps = {
  entries: PublicTournamentStanding[];
  emptyMessage: string;
  highlightOwnerId?: string | null;
  presentation?: 'full' | 'preview';
  previewLimit?: number;
};

const FULL_COLUMNS = [
  { key: 'rank', label: 'Rank', width: 68 },
  { key: 'player', label: 'Player', width: 190 },
  { key: 'score', label: 'Score', width: 90 },
  { key: 'subscore', label: 'Tiebreak', width: 96 },
  { key: 'writes', label: 'Writes', width: 90 },
  { key: 'updated', label: 'Updated', width: 170 },
] as const;

const PREVIEW_COLUMNS = [
  { key: 'rank', label: 'Rank', width: 68 },
  { key: 'player', label: 'Player', width: 188 },
  { key: 'score', label: 'Score', width: 86 },
  { key: 'result', label: 'Result', width: 92 },
] as const;

export const TournamentStandingsTable: React.FC<TournamentStandingsTableProps> = ({
  entries,
  emptyMessage,
  highlightOwnerId = null,
  presentation = 'full',
  previewLimit = 5,
}) => {
  const columns = presentation === 'preview' ? PREVIEW_COLUMNS : FULL_COLUMNS;
  const sortedEntries = entries
    .slice()
    .sort((left, right) => (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER));
  const displayedEntries =
    presentation === 'preview'
      ? (() => {
        const previewEntries = sortedEntries.slice(0, previewLimit);
        if (!highlightOwnerId || previewEntries.some((entry) => entry.ownerId === highlightOwnerId)) {
          return previewEntries;
        }

        const highlightedEntry = sortedEntries.find((entry) => entry.ownerId === highlightOwnerId);
        return highlightedEntry ? [...previewEntries, highlightedEntry] : previewEntries;
      })()
      : sortedEntries;

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
            {columns.map((column) => (
              <Text key={column.key} style={[styles.headerCell, { width: column.width }]}>
                {column.label}
              </Text>
            ))}
          </View>

          {displayedEntries.map((entry) => {
            const isHighlighted = highlightOwnerId !== null && entry.ownerId === highlightOwnerId;

            return (
              <View
                key={`${entry.ownerId}-${entry.rank ?? 'na'}`}
                style={[styles.bodyRow, presentation === 'preview' && styles.previewBodyRow, isHighlighted && styles.highlightedRow]}
              >
                <Text style={[styles.bodyCell, styles.rankCell, { width: columns[0].width }, isHighlighted && styles.highlightedCell]}>
                  {entry.rank ?? '-'}
                </Text>
                <View style={[styles.playerCellWrap, { width: columns[1].width }]}>
                  <View style={styles.playerNameRow}>
                    <Text numberOfLines={1} style={[styles.bodyCell, styles.playerName, isHighlighted && styles.highlightedCell]}>
                      {entry.username}
                    </Text>
                    {isHighlighted ? (
                      <View style={styles.playerHighlightBadge}>
                        <Text style={styles.playerHighlightBadgeText}>YOU</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text numberOfLines={1} style={styles.playerMeta}>
                    {entry.ownerId}
                  </Text>
                </View>
                <Text style={[styles.bodyCell, { width: columns[2].width }, isHighlighted && styles.highlightedCell]}>
                  {entry.score}
                </Text>
                {presentation === 'preview' ? (
                  <Text numberOfLines={1} style={[styles.bodyCell, { width: columns[3].width }, isHighlighted && styles.highlightedCell]}>
                    {entry.result ? entry.result.toUpperCase() : 'LIVE'}
                  </Text>
                ) : (
                  <>
                    <Text style={[styles.bodyCell, { width: FULL_COLUMNS[3].width }, isHighlighted && styles.highlightedCell]}>
                      {entry.subscore}
                    </Text>
                    <Text style={[styles.bodyCell, { width: FULL_COLUMNS[4].width }, isHighlighted && styles.highlightedCell]}>
                      {entry.attempts ?? 0}
                      {entry.maxAttempts ? ` / ${entry.maxAttempts}` : ''}
                    </Text>
                    <Text numberOfLines={1} style={[styles.bodyCell, { width: FULL_COLUMNS[5].width }, isHighlighted && styles.highlightedCell]}>
                      {formatTournamentDateTime(entry.updatedAt)}
                    </Text>
                  </>
                )}
              </View>
            );
          })}
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
  previewBodyRow: {
    minHeight: 52,
  },
  highlightedRow: {
    backgroundColor: 'rgba(28, 53, 78, 0.38)',
  },
  bodyCell: {
    color: urTheme.colors.shell,
    paddingRight: urTheme.spacing.sm,
    paddingVertical: urTheme.spacing.sm,
  },
  highlightedCell: {
    color: '#F9ECCC',
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
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: urTheme.spacing.xs,
  },
  playerMeta: {
    color: 'rgba(216, 232, 251, 0.62)',
    fontSize: 11,
    marginTop: 2,
  },
  playerHighlightBadge: {
    borderRadius: urTheme.radii.pill,
    paddingHorizontal: urTheme.spacing.xs + 2,
    paddingVertical: 3,
    backgroundColor: 'rgba(242, 193, 77, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 223, 156, 0.42)',
  },
  playerHighlightBadgeText: {
    ...urTypography.label,
    color: '#F8E7BF',
    fontSize: 9,
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
