import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

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
    pieceLightImageSource,
    pieceDarkImageSource,
  } = useCosmeticTheme();

  const emphasizePieces = cosmetic.type === 'pieces';
  const showPieces = cosmetic.type === 'board' || cosmetic.type === 'pieces';

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.previewFrame}>
        <Image
          source={boardImageSource}
          resizeMode="contain"
          style={[
            styles.boardImage,
            emphasizePieces ? styles.boardImageDimmed : null,
          ]}
        />

        {showPieces ? (
          <>
            <Image
              source={pieceDarkImageSource}
              resizeMode="contain"
              style={[
                styles.piece,
                emphasizePieces ? styles.pieceLarge : null,
                styles.pieceTop,
              ]}
            />
            <Image
              source={pieceLightImageSource}
              resizeMode="contain"
              style={[
                styles.piece,
                emphasizePieces ? styles.pieceLarge : null,
                styles.pieceCenter,
              ]}
            />
            <Image
              source={pieceDarkImageSource}
              resizeMode="contain"
              style={[
                styles.piece,
                emphasizePieces ? styles.pieceLarge : null,
                styles.pieceBottom,
              ]}
            />
          </>
        ) : null}
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
  previewFrame: {
    width: '100%',
    maxWidth: 420,
    aspectRatio: 0.78,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  boardImage: {
    width: '100%',
    height: '100%',
  },
  boardImageDimmed: {
    opacity: 0.92,
  },
  piece: {
    position: 'absolute',
    width: '14%',
    height: '14%',
  },
  pieceLarge: {
    width: '17%',
    height: '17%',
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
