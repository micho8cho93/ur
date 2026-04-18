import { Dice } from '@/components/game/Dice';
import { BoardCosmeticPreview } from '@/components/cosmetics/BoardCosmeticPreview';
import { Button } from '@/components/ui/Button';
import { cosmeticDefinitionToTheme } from '@/shared/cosmeticTheme';
import type { CosmeticDefinition, CosmeticTier } from '@/shared/cosmetics';
import type { AudioAssetSource } from '@/src/cosmetics/audioAssets';
import { CosmeticThemeProvider, useCosmeticTheme } from '@/src/store/CosmeticThemeContext';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CurrencyAmount, type CurrencyIconVariant } from '@/components/wallet/CurrencyIcon';

type CosmeticPreviewModalProps = {
  visible: boolean;
  cosmetic: CosmeticDefinition | null;
  onClose: () => void;
  onBuy: (cosmetic: CosmeticDefinition) => void;
  isOwned: boolean;
  relatedCosmetics?: CosmeticDefinition[];
};

const tierColors: Record<CosmeticTier, { bg: string; text: string; accent: string }> = {
  common: { bg: '#475569', text: '#f8fafc', accent: '#94a3b8' },
  rare: { bg: '#1d4ed8', text: '#dbeafe', accent: '#60a5fa' },
  epic: { bg: '#7e22ce', text: '#f3e8ff', accent: '#c084fc' },
  legendary: { bg: '#b45309', text: '#fef3c7', accent: '#fbbf24' },
};

const getCurrencyVariant = (item: CosmeticDefinition): CurrencyIconVariant =>
  item.price.currency === 'premium' ? 'gem' : 'coin';

const PriceAmount = ({
  item,
  style,
  textStyle,
}: {
  item: CosmeticDefinition;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) => (
  <CurrencyAmount
    amount={item.price.amount}
    variant={getCurrencyVariant(item)}
    iconSize={15}
    style={style}
    textStyle={textStyle}
  />
);

const randomDiceValue = (): number => Math.floor(Math.random() * 5);

const getPreviewSwatchColor = (cosmetic: CosmeticDefinition): string => {
  return tierColors[cosmetic.tier].accent;
};

const AudioPreviewPanel = ({ type }: { type: 'music' | 'sound_effect' }) => {
  const { musicTrackSource, soundEffectPreviewSources } = useCosmeticTheme();
  const activePlayersRef = useRef<AudioPlayer[]>([]);
  const [playingLabel, setPlayingLabel] = useState<string | null>(null);

  const stopActivePlayers = React.useCallback(() => {
    activePlayersRef.current.forEach((player) => {
      try {
        player.pause();
        player.remove();
      } catch {
        // Best effort preview cleanup.
      }
    });
    activePlayersRef.current = [];
    setPlayingLabel(null);
  }, []);

  useEffect(
    () => () => {
      activePlayersRef.current.forEach((player) => {
        try {
          player.pause();
          player.remove();
        } catch {
          // Best effort preview cleanup.
        }
      });
      activePlayersRef.current = [];
    },
    [],
  );

  const playSource = React.useCallback(
    (source: AudioAssetSource, label: string, options?: { loop?: boolean }) => {
      stopActivePlayers();
      const player = createAudioPlayer(source, { downloadFirst: true, updateInterval: 120 });
      player.loop = Boolean(options?.loop);
      player.volume = type === 'music' ? 0.55 : 0.9;
      activePlayersRef.current = [player];
      setPlayingLabel(label);
      player.play();
    },
    [stopActivePlayers, type],
  );

  const playRollSequence = React.useCallback(() => {
    stopActivePlayers();
    const players = soundEffectPreviewSources.roll.map((source) =>
      createAudioPlayer(source, { downloadFirst: true, updateInterval: 120 }),
    );
    players.forEach((player) => {
      player.volume = 0.9;
    });
    activePlayersRef.current = players;
    setPlayingLabel('Roll');
    players[0]?.play();
    if (players[1]) {
      setTimeout(() => {
        players[1]?.play();
      }, 420);
    }
  }, [soundEffectPreviewSources.roll, stopActivePlayers]);

  if (type === 'music') {
    return (
      <View style={styles.audioPreview} testID="cosmetic-preview-music">
        <View style={styles.audioIcon}>
          <Text style={styles.audioIconText}>♪</Text>
        </View>
        <Text style={styles.audioTitle}>Music preview</Text>
        <Text style={styles.previewHint}>Play a short loop before adding it to your collection.</Text>
        <View style={styles.audioActions}>
          <Button
            title={playingLabel ? 'Stop' : 'Play'}
            variant={playingLabel ? 'outline' : 'primary'}
            onPress={() => {
              if (playingLabel) {
                stopActivePlayers();
                return;
              }
              playSource(musicTrackSource, 'Music', { loop: true });
            }}
            style={styles.audioButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.audioPreview} testID="cosmetic-preview-sound-effect">
      <View style={styles.audioIcon}>
        <Text style={styles.audioIconText}>SFX</Text>
      </View>
      <Text style={styles.audioTitle}>Sound effects preview</Text>
      <Text style={styles.previewHint}>Tap cues from the pack and hear how the board responds.</Text>
      <View style={styles.sfxGrid}>
        <Button title="Roll" variant="outline" onPress={playRollSequence} style={styles.sfxButton} />
        <Button title="Move" variant="outline" onPress={() => playSource(soundEffectPreviewSources.move, 'Move')} style={styles.sfxButton} />
        <Button title="Score" variant="outline" onPress={() => playSource(soundEffectPreviewSources.score, 'Score')} style={styles.sfxButton} />
        <Button title="Capture" variant="outline" onPress={() => playSource(soundEffectPreviewSources.capture, 'Capture')} style={styles.sfxButton} />
      </View>
      {playingLabel ? <Text style={styles.playingLabel}>Playing {playingLabel}</Text> : null}
    </View>
  );
};

export const CosmeticPreviewModal = ({
  visible,
  cosmetic,
  onClose,
  onBuy,
  isOwned,
  relatedCosmetics = [],
}: CosmeticPreviewModalProps) => {
  const [activeCosmeticId, setActiveCosmeticId] = useState<string | null>(cosmetic?.id ?? null);
  const [diceRollValue, setDiceRollValue] = useState<number>(randomDiceValue);

  useEffect(() => {
    if (cosmetic?.id) {
      setActiveCosmeticId(cosmetic.id);
      setDiceRollValue(randomDiceValue());
    }
  }, [cosmetic?.id]);

  const comparisonCosmetics = useMemo(() => {
    const byId = new Map<string, CosmeticDefinition>();
    if (cosmetic) {
      byId.set(cosmetic.id, cosmetic);
    }
    relatedCosmetics.forEach((item) => {
      if (!byId.has(item.id)) {
        byId.set(item.id, item);
      }
    });
    return Array.from(byId.values()).slice(0, 5);
  }, [cosmetic, relatedCosmetics]);

  const activeCosmetic = useMemo(
    () => comparisonCosmetics.find((item) => item.id === activeCosmeticId) ?? cosmetic,
    [activeCosmeticId, comparisonCosmetics, cosmetic],
  );
  const activeTheme = useMemo(
    () => (activeCosmetic ? cosmeticDefinitionToTheme(activeCosmetic) : {}),
    [activeCosmetic],
  );
  const activeIsOwned = Boolean(activeCosmetic && cosmetic && activeCosmetic.id === cosmetic.id && isOwned);

  const renderPreviewContent = () => {
    if (!activeCosmetic) {
      return null;
    }

    if (activeCosmetic.type === 'dice_animation') {
      return (
        <View style={styles.dicePreview} testID="cosmetic-preview-dice">
          <Dice
            value={diceRollValue}
            rolling={false}
            onRoll={() => setDiceRollValue(randomDiceValue())}
            canRoll
            mode="panel"
            showStatusCopy
          />
          <Text style={styles.previewHint}>Tap Roll to test the finish.</Text>
        </View>
      );
    }

    if (activeCosmetic.type === 'emote') {
      return (
        <View style={styles.emotePreview} testID="cosmetic-preview-emote">
          <View style={[styles.emotePulse, { borderColor: tierColors[activeCosmetic.tier].accent }]}>
            <Text style={styles.emoteGlyph}>...</Text>
          </View>
          <Text style={styles.emoteTitle}>Emote preview coming soon</Text>
          <Text style={styles.previewHint}>This reaction will get its full animation pass later.</Text>
        </View>
      );
    }

    if (activeCosmetic.type === 'music' || activeCosmetic.type === 'sound_effect') {
      return <AudioPreviewPanel type={activeCosmetic.type} />;
    }

    return (
      <View style={styles.boardPreview}>
        <BoardCosmeticPreview
          cosmetic={activeCosmetic}
          testID="cosmetic-preview-board"
        />
      </View>
    );
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close preview"
              onPress={onClose}
              style={styles.closeButton}
              testID="cosmetic-preview-close"
            >
              <Text style={styles.closeText}>X</Text>
            </Pressable>
            <Text style={styles.title} numberOfLines={1} testID="cosmetic-preview-title">
              {activeCosmetic?.name ?? 'Preview'}
            </Text>
            {activeCosmetic ? (
              <View style={[styles.tierBadge, { backgroundColor: tierColors[activeCosmetic.tier].bg }]}>
                <Text style={[styles.tierText, { color: tierColors[activeCosmetic.tier].text }]}>
                  {activeCosmetic.tier.toUpperCase()}
                </Text>
              </View>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <CosmeticThemeProvider theme={activeTheme}>
              <View style={styles.previewArea}>{renderPreviewContent()}</View>
            </CosmeticThemeProvider>

            {comparisonCosmetics.length > 1 ? (
              <View style={styles.compareSection}>
                <Text style={styles.compareLabel}>Compare with others in this section</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compareRow}>
                  {comparisonCosmetics.map((item) => {
                    const active = item.id === activeCosmetic?.id;
                    return (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        onPress={() => setActiveCosmeticId(item.id)}
                        style={[styles.compareChip, active && styles.compareChipActive]}
                        testID={`cosmetic-preview-chip-${item.id}`}
                      >
                        <View style={[styles.compareSwatch, { backgroundColor: getPreviewSwatchColor(item) }]} />
                        <Text style={styles.compareName} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {activeCosmetic ? (
              <View style={styles.infoRow}>
                <View style={[styles.tierBadge, { backgroundColor: tierColors[activeCosmetic.tier].bg }]}>
                  <Text style={[styles.tierText, { color: tierColors[activeCosmetic.tier].text }]}>
                    {activeCosmetic.tier.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.infoTier}>{activeCosmetic.tier}</Text>
                <View style={styles.infoDivider} />
                {activeIsOwned ? (
                  <Text style={styles.ownedBadge}>Owned</Text>
                ) : (
                  <PriceAmount
                    item={activeCosmetic}
                    style={styles.priceAmount}
                    textStyle={styles.priceText}
                  />
                )}
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.actionBar}>
            <Button
              title={
                activeCosmetic
                  ? activeIsOwned
                    ? 'Owned'
                    : 'Buy'
                  : 'Buy'
              }
              disabled={!activeCosmetic || activeIsOwned}
              variant={activeIsOwned ? 'secondary' : 'primary'}
              onPress={() => {
                if (activeCosmetic) {
                  onBuy(activeCosmetic);
                }
              }}
              style={styles.actionButton}
              testID="cosmetic-preview-buy"
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.86)',
  },
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.22)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.24)',
  },
  closeText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '900',
  },
  title: {
    flex: 1,
    marginHorizontal: 12,
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 76,
  },
  tierBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 18,
    gap: 16,
  },
  previewArea: {
    width: '100%',
    minHeight: 360,
    maxHeight: 520,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  boardPreview: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dicePreview: {
    width: '100%',
    maxWidth: 420,
    gap: 14,
    alignSelf: 'center',
  },
  emotePreview: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emotePulse: {
    width: 112,
    height: 112,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
  },
  emoteGlyph: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: '900',
  },
  emoteTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
  },
  audioPreview: {
    width: '100%',
    maxWidth: 440,
    minHeight: 320,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  audioIcon: {
    width: 112,
    height: 112,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(250, 204, 21, 0.62)',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioIconText: {
    color: '#fde68a',
    fontSize: 26,
    fontWeight: '900',
  },
  audioTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
  },
  audioActions: {
    width: '100%',
    marginTop: 8,
  },
  audioButton: {
    minHeight: 56,
  },
  sfxGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  sfxButton: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 52,
  },
  playingLabel: {
    color: '#fde68a',
    fontSize: 13,
    fontWeight: '800',
  },
  previewHint: {
    color: '#cbd5e1',
    textAlign: 'center',
    fontWeight: '700',
  },
  compareSection: {
    gap: 8,
  },
  compareLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '800',
  },
  compareRow: {
    gap: 10,
    paddingRight: 12,
  },
  compareChip: {
    width: 132,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    padding: 8,
    gap: 6,
  },
  compareChipActive: {
    borderColor: 'rgba(250, 204, 21, 0.76)',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
  },
  compareSwatch: {
    height: 34,
    borderRadius: 6,
  },
  compareName: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
  },
  infoRow: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.24)',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoTier: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  infoDivider: {
    flex: 1,
  },
  ownedBadge: {
    color: '#bbf7d0',
    fontSize: 14,
    fontWeight: '900',
  },
  priceText: {
    color: '#fde68a',
    fontSize: 14,
    fontWeight: '900',
  },
  priceAmount: {
    justifyContent: 'flex-end',
  },
  actionBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.22)',
    backgroundColor: '#020617',
  },
  actionButton: {
    minHeight: 56,
  },
});
