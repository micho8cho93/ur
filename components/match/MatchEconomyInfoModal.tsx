import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Modal } from '@/components/ui/Modal';
import { boxShadow } from '@/constants/styleEffects';
import { urTextColors, urTextVariants, urTheme } from '@/constants/urTheme';
import { getVisibleMatchEconomyRows, type MatchEconomyDetails } from '@/shared/matchEconomy';

type MatchEconomyInfoModalProps = {
  visible: boolean;
  title: string;
  details: MatchEconomyDetails | null;
  onClose: () => void;
};

export const MatchEconomyInfoModal: React.FC<MatchEconomyInfoModalProps> = ({
  visible,
  title,
  details,
  onClose,
}) => {
  if (!details) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      title={title}
      message={details.description}
      actionLabel="Close"
      onAction={onClose}
      maxWidth={500}
    >
      <View style={styles.rows}>
        {getVisibleMatchEconomyRows(details).map((row) => {
          return (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={[styles.rowValue, row.tone === 'earn' && styles.rowValueEarn, row.tone === 'cost' && styles.rowValueCost]}>
                {row.value}
              </Text>
            </View>
          );
        })}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  rows: {
    gap: urTheme.spacing.sm,
    marginTop: urTheme.spacing.xs,
  },
  row: {
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(246, 214, 151, 0.18)',
    backgroundColor: 'rgba(10, 16, 24, 0.42)',
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: urTheme.spacing.sm,
    gap: 4,
    ...boxShadow({
      color: '#000',
      opacity: 0.14,
      offset: { width: 0, height: 3 },
      blurRadius: 6,
      elevation: 2,
    }),
  },
  rowLabel: {
    ...urTextVariants.caption,
    color: urTextColors.captionOnPanel,
    fontSize: 10,
    lineHeight: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowValue: {
    ...urTextVariants.body,
    color: urTextColors.bodyOnPanel,
    fontSize: 13,
    lineHeight: 18,
  },
  rowValueEarn: {
    color: '#F5DDAE',
  },
  rowValueCost: {
    color: '#F0A59B',
  },
});
