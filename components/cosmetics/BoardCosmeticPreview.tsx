import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { CosmeticDefinition } from '@/shared/cosmetics';
import { useCosmeticTheme } from '@/src/store/CosmeticThemeContext';

type BoardCosmeticPreviewProps = {
  cosmetic: CosmeticDefinition;
  testID?: string;
};

export function BoardCosmeticPreview({
  cosmetic,
  testID,
}: BoardCosmeticPreviewProps) {
  const {
    boardImageSource,
    pieceImageSources,
  } = useCosmeticTheme();

  if (cosmetic.type === 'pieces') {
    return (
      <View style={styles.root} testID={testID}>
        <View style={styles.piecePreviewFrame} testID="cosmetic-preview-piece">
          <View style={styles.piecePreviewHeader}>
            <Text style={styles.piecePreviewTitle}>Piece preview</Text>
            <Text style={styles.piecePreviewSubtitle}>Showing the actual piece art without the board backdrop.</Text>
          </View>

          <View style={styles.piecePreviewRow}>
            <View style={styles.pieceSample} testID="cosmetic-preview-piece-light">
              <Image
                testID="cosmetic-preview-piece-light-image"
                source={pieceImageSources.light}
                resizeMode="contain"
                style={styles.pieceArtwork}
              />
              <Text style={styles.pieceSampleLabel}>Light</Text>
            </View>
            <View style={styles.pieceSample} testID="cosmetic-preview-piece-dark">
              <Image
                testID="cosmetic-preview-piece-dark-image"
                source={pieceImageSources.dark}
                resizeMode="contain"
                style={styles.pieceArtwork}
              />
              <Text style={styles.pieceSampleLabel}>Dark</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.boardPreviewFrame} testID="cosmetic-preview-board">
        <Image
          testID="cosmetic-preview-board-image"
          source={boardImageSource}
          resizeMode="contain"
          style={styles.boardImage}
        />
        <Image
          source={pieceImageSources.dark}
          resizeMode="contain"
          style={[styles.piece, styles.pieceTop]}
        />
        <Image
          source={pieceImageSources.light}
          resizeMode="contain"
          style={[styles.piece, styles.pieceCenter]}
        />
        <Image
          source={pieceImageSources.dark}
          resizeMode="contain"
          style={[styles.piece, styles.pieceBottom]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardPreviewFrame: {
    width: '100%',
    maxWidth: 420,
    aspectRatio: 0.78,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  piecePreviewFrame: {
    width: '100%',
    maxWidth: 420,
    aspectRatio: 0.78,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    justifyContent: 'space-between',
  },
  piecePreviewHeader: {
    gap: 6,
  },
  piecePreviewTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  piecePreviewSubtitle: {
    color: 'rgba(226, 232, 240, 0.78)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  piecePreviewRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  pieceSample: {
    flex: 1,
    maxWidth: 160,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
  },
  pieceArtwork: {
    width: '100%',
    height: 120,
  },
  pieceSampleLabel: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  boardImage: {
    width: '100%',
    height: '100%',
  },
  piece: {
    position: 'absolute',
    width: '14%',
    height: '14%',
  },
  pieceTop: {
    top: '16%',
    left: '50%',
    transform: [{ translateX: -28 }],
  },
  pieceCenter: {
    top: '43%',
    left: '52%',
    transform: [{ translateX: -28 }],
  },
  pieceBottom: {
    top: '71%',
    left: '50%',
    transform: [{ translateX: -28 }],
  },
});
