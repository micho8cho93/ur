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
          source={pieceImageSources.light}
          resizeMode="contain"
          style={[styles.piece, styles.pieceTop]}
        />
        <Image
          source={pieceImageSources.dark}
          resizeMode="contain"
          style={[styles.piece, styles.pieceCenter]}
        />
        <Image
          source={pieceImageSources.light}
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
    aspectRatio: 0.55,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieceSample: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(30, 41, 59, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
  },
  pieceArtwork: {
    width: '80%',
    height: '80%',
  },
  boardImage: {
    width: '100%',
    height: '100%',
  },
  piece: {
    position: 'absolute',
    width: '10%',
    aspectRatio: 1,
  },
  pieceTop: {
    top: '15%',
    left: '44%',
  },
  pieceCenter: {
    top: '48%',
    left: '49%',
  },
  pieceBottom: {
    top: '71%',
    left: '39%',
  },
});
