import { getBoardImageSource } from '@/src/cosmetics/boardAssets';
import { getMusicTrackSource, getSoundEffectPreviewSources, type SoundEffectPreviewSources } from '@/src/cosmetics/audioAssets';
import { type DiceImageSources, getDiceImageSources } from '@/src/cosmetics/diceAssets';
import { type PieceImageSources, getPieceImageSources } from '@/src/cosmetics/pieceAssets';
import { type TileImageSources, getTileImageSources } from '@/src/cosmetics/tileAssets';
import {
  type BoardTheme,
  type CosmeticTheme,
  type DiceTheme,
  type MusicTheme,
  type PiecesTheme,
  type SoundEffectsTheme,
  resolveBoardTheme,
  resolveDiceTheme,
  resolveMusicTheme,
  resolvePiecesTheme,
  resolveSoundEffectsTheme,
} from '@/shared/cosmeticTheme';
import React, { createContext, useContext, useMemo } from 'react';
import type { ImageSourcePropType } from 'react-native';

export type CosmeticThemeContextValue = {
  board: BoardTheme;
  pieces: PiecesTheme;
  dice: DiceTheme;
  music: MusicTheme;
  soundEffects: SoundEffectsTheme;
  boardImageSource: ImageSourcePropType;
  tileImageSources: TileImageSources;
  pieceImageSources: PieceImageSources;
  diceImageSources: DiceImageSources;
  musicTrackSource: number;
  soundEffectPreviewSources: SoundEffectPreviewSources;
  hasBoardTileAssetOverride: boolean;
  hasPieceAssetOverride: boolean;
  hasDiceAssetOverride: boolean;
  hasMusicAssetOverride: boolean;
  hasSoundEffectAssetOverride: boolean;
};

const DEFAULT_CONTEXT_VALUE: CosmeticThemeContextValue = {
  board: resolveBoardTheme(),
  pieces: resolvePiecesTheme(),
  dice: resolveDiceTheme(),
  music: resolveMusicTheme(),
  soundEffects: resolveSoundEffectsTheme(),
  boardImageSource: getBoardImageSource(),
  tileImageSources: getTileImageSources(),
  pieceImageSources: getPieceImageSources(),
  diceImageSources: getDiceImageSources(),
  musicTrackSource: getMusicTrackSource(),
  soundEffectPreviewSources: getSoundEffectPreviewSources(),
  hasBoardTileAssetOverride: false,
  hasPieceAssetOverride: false,
  hasDiceAssetOverride: false,
  hasMusicAssetOverride: false,
  hasSoundEffectAssetOverride: false,
};

const CosmeticThemeContext = createContext<CosmeticThemeContextValue>(DEFAULT_CONTEXT_VALUE);

type CosmeticThemeProviderProps = {
  theme: CosmeticTheme;
  children: React.ReactNode;
};

export const CosmeticThemeProvider = ({ theme, children }: CosmeticThemeProviderProps) => {
  const value = useMemo<CosmeticThemeContextValue>(() => {
    const board = resolveBoardTheme(theme.board);
    const pieces = resolvePiecesTheme(theme.pieces);
    const dice = resolveDiceTheme(theme.dice);
    const music = resolveMusicTheme(theme.music);
    const soundEffects = resolveSoundEffectsTheme(theme.soundEffects);

    return {
      board,
      pieces,
      dice,
      music,
      soundEffects,
      boardImageSource: getBoardImageSource(board.imageAssetKey),
      tileImageSources: getTileImageSources(board),
      pieceImageSources: getPieceImageSources(pieces),
      diceImageSources: getDiceImageSources(dice),
      musicTrackSource: getMusicTrackSource(music.trackAssetKey),
      soundEffectPreviewSources: getSoundEffectPreviewSources(soundEffects),
      hasBoardTileAssetOverride: Boolean(
        theme.board?.normalTileAssetKey ||
          theme.board?.rosetteTileAssetKey ||
          theme.board?.warTileAssetKey,
      ),
      hasPieceAssetOverride: Boolean(
        theme.pieces?.lightPieceAssetKey ||
          theme.pieces?.darkPieceAssetKey ||
          theme.pieces?.reservePieceAssetKey,
      ),
      hasDiceAssetOverride: Boolean(theme.dice?.markedDieAssetKey || theme.dice?.unmarkedDieAssetKey),
      hasMusicAssetOverride: Boolean(theme.music?.trackAssetKey),
      hasSoundEffectAssetOverride: Boolean(
        theme.soundEffects?.rollSequenceAssetKey ||
          theme.soundEffects?.moveAssetKey ||
          theme.soundEffects?.scoreAssetKey ||
          theme.soundEffects?.captureAssetKey,
      ),
    };
  }, [theme]);

  return <CosmeticThemeContext.Provider value={value}>{children}</CosmeticThemeContext.Provider>;
};

export const useCosmeticTheme = (): CosmeticThemeContextValue => useContext(CosmeticThemeContext);
