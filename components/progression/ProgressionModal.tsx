import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import type { ProgressionSnapshot } from '@/shared/progression';
import React from 'react';
import { Image, Modal as RNModal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  PROGRESSION_DISPLAY_RANKS,
  formatProgressionXp,
  getProgressionDisplayTitle,
} from '@/src/progression/progressionDisplay';
import { RankBadge } from './RankBadge';
import { Button } from '../ui/Button';

interface ProgressionModalProps {
  visible: boolean;
  onClose: () => void;
  progression: ProgressionSnapshot | null;
}

const getCurrentRankIndex = (totalXp: number | null): number => {
  if (totalXp === null) {
    return -1;
  }

  let currentIndex = -1;
  for (const rank of PROGRESSION_DISPLAY_RANKS) {
    if (totalXp >= rank.threshold) {
      currentIndex = rank.index;
    }
  }

  return currentIndex;
};

export const ProgressionModal: React.FC<ProgressionModalProps> = ({
  visible,
  onClose,
  progression,
}) => {
  const totalXp = progression?.totalXp ?? null;
  const currentRankIndex = getCurrentRankIndex(totalXp);
  const currentRankTitle = getProgressionDisplayTitle(progression?.currentRank) ?? progression?.currentRank ?? null;
  const nextRankTitle = getProgressionDisplayTitle(progression?.nextRank) ?? progression?.nextRank ?? null;

  return (
    <RNModal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close progression details"
        />

        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']} pointerEvents="box-none">
          <View style={styles.centerWrap} pointerEvents="box-none">
            <View style={styles.sheet} accessibilityViewIsModal>
              <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.texture} />
              <Image source={urTextures.border} resizeMode="repeat" style={styles.borderTexture} />
              <View style={styles.sheetGlow} />
              <View style={styles.border} />

              <View style={styles.headerRow}>
                <View style={styles.titleColumn}>
                  <Text style={styles.title}>XP & Ranks</Text>
                  <Text style={styles.subtitle}>
                    Wins currently grant XP. Your total lifetime XP determines your rank title.
                  </Text>
                </View>

                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Close progression details"
                  hitSlop={8}
                >
                  <Text style={styles.closeButtonLabel}>X</Text>
                </Pressable>
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator
              >
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryEyebrow}>Current Standing</Text>
                  {progression ? (
                    <>
                      <RankBadge
                        title={currentRankTitle ?? progression.currentRank}
                        tone={nextRankTitle ? 'current' : 'max'}
                        size="sm"
                      />
                      <Text style={styles.summaryValue}>{formatProgressionXp(progression.totalXp)} XP</Text>
                      <Text style={styles.summaryText}>
                        {nextRankTitle
                          ? `${formatProgressionXp(progression.xpNeededForNextRank)} XP until ${nextRankTitle}.`
                          : 'You have reached the final title in the current progression ladder.'}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.summaryText}>
                      Your progression record will appear here once it loads from the server.
                    </Text>
                  )}
                </View>

                <View style={styles.copySection}>
                  <Text style={styles.sectionTitle}>How it works</Text>
                  <Text style={styles.copyLine}>XP is earned from wins.</Text>
                  <Text style={styles.copyLine}>Higher total XP unlocks higher rank titles.</Text>
                  <Text style={styles.copyLine}>Rank is based on total lifetime XP.</Text>
                </View>

                <View style={styles.copySection}>
                  <Text style={styles.sectionTitle}>Rank ladder</Text>
                  {PROGRESSION_DISPLAY_RANKS.map((rank) => {
                    const state =
                      currentRankIndex === -1
                        ? 'upcoming'
                        : rank.index < currentRankIndex
                          ? 'completed'
                          : rank.index === currentRankIndex
                            ? 'current'
                            : 'upcoming';

                    return (
                      <View
                        key={rank.index}
                        style={[
                          styles.rankRow,
                          state === 'completed' && styles.rankRowCompleted,
                          state === 'current' && styles.rankRowCurrent,
                        ]}
                      >
                        <View style={styles.rankRowMain}>
                          <Text
                            style={[
                              styles.rankRowTitle,
                              state === 'upcoming' && styles.rankRowTitleUpcoming,
                            ]}
                          >
                            {rank.index}. {rank.displayTitle}
                          </Text>
                          <Text style={styles.rankRowThreshold}>
                            {formatProgressionXp(rank.threshold)} XP
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.rankStateBadge,
                            state === 'completed' && styles.rankStateBadgeCompleted,
                            state === 'current' && styles.rankStateBadgeCurrent,
                          ]}
                        >
                          <Text style={styles.rankStateBadgeLabel}>
                            {state === 'completed' ? 'Done' : state === 'current' ? 'Current' : 'Ahead'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <Button title="Close" variant="outline" onPress={onClose} />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 12, 0.24)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 7, 12, 0.68)',
  },
  safeArea: {
    flex: 1,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.md,
  },
  sheet: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '92%',
    borderRadius: urTheme.radii.lg,
    overflow: 'hidden',
    backgroundColor: '#2C1B12',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 164, 65, 0.74)',
    paddingHorizontal: urTheme.spacing.lg,
    paddingTop: urTheme.spacing.lg,
    paddingBottom: urTheme.spacing.md,
    ...boxShadow({
      color: '#000',
      opacity: 0.34,
      offset: { width: 0, height: 12 },
      blurRadius: 18,
      elevation: 12,
    }),
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  borderTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.13,
  },
  sheetGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(255, 222, 166, 0.14)',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(252, 225, 177, 0.28)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
    marginBottom: urTheme.spacing.md,
  },
  titleColumn: {
    flex: 1,
    gap: 6,
  },
  title: {
    ...urTypography.title,
    color: urTheme.colors.parchment,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    color: 'rgba(246, 231, 203, 0.82)',
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(236, 205, 152, 0.35)',
    backgroundColor: 'rgba(12, 15, 18, 0.38)',
  },
  closeButtonPressed: {
    opacity: 0.8,
  },
  closeButtonLabel: {
    color: urTheme.colors.parchment,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '700',
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: urTheme.spacing.sm,
    gap: urTheme.spacing.md,
  },
  summaryCard: {
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(236, 205, 152, 0.18)',
    backgroundColor: 'rgba(9, 17, 25, 0.34)',
    padding: urTheme.spacing.md,
    gap: urTheme.spacing.xs,
  },
  summaryEyebrow: {
    ...urTypography.label,
    color: 'rgba(240, 224, 196, 0.68)',
    fontSize: 10,
  },
  summaryValue: {
    ...urTypography.title,
    color: '#FAEDD7',
    fontSize: 24,
    lineHeight: 28,
  },
  summaryText: {
    color: 'rgba(246, 231, 203, 0.84)',
    fontSize: 13,
    lineHeight: 19,
  },
  copySection: {
    gap: 8,
  },
  sectionTitle: {
    ...urTypography.subtitle,
    color: '#F3DFBE',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  copyLine: {
    color: 'rgba(247, 229, 203, 0.94)',
    fontSize: 14,
    lineHeight: 20,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
    paddingHorizontal: urTheme.spacing.sm + 2,
    paddingVertical: urTheme.spacing.sm,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(232, 214, 180, 0.12)',
    backgroundColor: 'rgba(11, 15, 22, 0.22)',
  },
  rankRowCompleted: {
    backgroundColor: 'rgba(52, 34, 18, 0.48)',
    borderColor: 'rgba(236, 205, 152, 0.18)',
  },
  rankRowCurrent: {
    backgroundColor: 'rgba(17, 41, 69, 0.74)',
    borderColor: 'rgba(236, 205, 152, 0.38)',
  },
  rankRowMain: {
    flex: 1,
    gap: 2,
  },
  rankRowTitle: {
    color: '#FAEDD7',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },
  rankRowTitleUpcoming: {
    color: 'rgba(244, 230, 206, 0.8)',
  },
  rankRowThreshold: {
    color: 'rgba(242, 227, 199, 0.7)',
    fontSize: 12,
    lineHeight: 17,
  },
  rankStateBadge: {
    minWidth: 72,
    borderRadius: urTheme.radii.pill,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14, 18, 24, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(236, 205, 152, 0.12)',
  },
  rankStateBadgeCompleted: {
    backgroundColor: 'rgba(117, 78, 31, 0.42)',
    borderColor: 'rgba(236, 205, 152, 0.18)',
  },
  rankStateBadgeCurrent: {
    backgroundColor: 'rgba(33, 81, 146, 0.7)',
    borderColor: 'rgba(238, 217, 182, 0.3)',
  },
  rankStateBadgeLabel: {
    ...urTypography.label,
    color: '#F8ECD6',
    fontSize: 10,
  },
  footer: {
    marginTop: urTheme.spacing.sm,
  },
});
