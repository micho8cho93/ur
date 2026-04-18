import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { urTheme, urTextVariants, urTypography } from '@/constants/urTheme';
import { EQUIPPED_EMOJI_SLOT_COUNT } from '@/shared/emojiReactions';
import { type CosmeticType } from '@/shared/cosmetics';
import { useInventory } from '@/src/store/InventoryContext';

type InventorySection = {
  type: CosmeticType;
  label: string;
  description: string;
};

const INVENTORY_SECTIONS: InventorySection[] = [
  {
    type: 'board',
    label: 'Boards',
    description: 'Pick the board art that frames every match.',
  },
  {
    type: 'pieces',
    label: 'Pieces',
    description: 'Choose the piece set that appears on the board.',
  },
  {
    type: 'dice_animation',
    label: 'Dice',
    description: 'Swap the dice skin used for rolls and previews.',
  },
  {
    type: 'music',
    label: 'Music',
    description: 'Set the match soundtrack from your collection.',
  },
  {
    type: 'sound_effect',
    label: 'Sound Effects',
    description: 'Equip a sound pack for rolls, moves, and captures.',
  },
  {
    type: 'emote',
    label: 'Emojis',
    description: 'Equip up to seven extra reactions from your collection.',
  },
];

const formatEquippedLabel = (name: string | null): string => (name ? name : 'None equipped');

function InventoryItemCard({
  title,
  typeLabel,
  isEquipped,
  onEquip,
  onUnequip,
}: {
  title: string;
  typeLabel: string;
  isEquipped: boolean;
  onEquip: () => void;
  onUnequip: () => void;
}) {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemCardHeader}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemType}>{typeLabel}</Text>
      </View>
      <Text style={styles.itemStatus}>{isEquipped ? 'Equipped for matches' : 'Owned and ready'}</Text>
      <View style={styles.itemActions}>
        {isEquipped ? (
          <Button title="Unequip" variant="outline" onPress={onUnequip} style={styles.itemButton} />
        ) : (
          <Button title="Equip" onPress={onEquip} style={styles.itemButton} />
        )}
      </View>
    </View>
  );
}

export default function InventoryScreen() {
  const {
    isLoading,
    errorMessage,
    ownedCosmeticsByType,
    equippedCosmeticsByType,
    equippedEmoteCosmetics,
    equipCosmetic,
    unequipCosmetic,
    unequipEmoteCosmetic,
    unequipEmoteSlot,
    resetLoadout,
    refresh,
  } = useInventory();

  const emoteSlotsFilled = equippedEmoteCosmetics.filter(Boolean).length;
  const hasAnyEquipped =
    INVENTORY_SECTIONS.some((section) =>
      section.type === 'emote' ? emoteSlotsFilled > 0 : Boolean(equippedCosmeticsByType[section.type]),
    );

  return (
    <>
      <Stack.Screen options={{ title: 'Inventory' }} />
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.kicker}>Loadout</Text>
            <Text style={styles.title}>Inventory</Text>
            <Text style={styles.subtitle}>
              Manage the assets you own and decide what shows up in your matches.
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Boards</Text>
              <Text style={styles.summaryValue}>
                {formatEquippedLabel(equippedCosmeticsByType.board?.name ?? null)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pieces</Text>
              <Text style={styles.summaryValue}>
                {formatEquippedLabel(equippedCosmeticsByType.pieces?.name ?? null)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Dice</Text>
              <Text style={styles.summaryValue}>
                {formatEquippedLabel(equippedCosmeticsByType.dice_animation?.name ?? null)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Music</Text>
              <Text style={styles.summaryValue}>
                {formatEquippedLabel(equippedCosmeticsByType.music?.name ?? null)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sound Effects</Text>
              <Text style={styles.summaryValue}>
                {formatEquippedLabel(equippedCosmeticsByType.sound_effect?.name ?? null)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Emojis</Text>
              <Text style={styles.summaryValue}>
                {`${emoteSlotsFilled}/${EQUIPPED_EMOJI_SLOT_COUNT} equipped`}
              </Text>
            </View>
            <View style={styles.summaryActions}>
              <Button
                title="Refresh"
                variant="outline"
                onPress={() => {
                  void refresh();
                }}
                style={styles.summaryButton}
              />
              <Button
                title="Unequip all"
                variant="outline"
                disabled={!hasAnyEquipped}
                onPress={() => {
                  void resetLoadout();
                }}
                style={styles.summaryButton}
              />
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={urTheme.colors.parchment} />
              <Text style={styles.loadingText}>Loading your collection...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Inventory unavailable</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Button
                title="Try again"
                onPress={() => {
                  void refresh();
                }}
                style={styles.errorButton}
              />
            </View>
          ) : (
            INVENTORY_SECTIONS.map((section) => {
              const items = ownedCosmeticsByType[section.type];
              const equippedItem = equippedCosmeticsByType[section.type];

              if (section.type === 'emote') {
                return (
                  <View key={section.type} style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionHeaderText}>
                        <Text style={styles.sectionTitle}>{section.label}</Text>
                        <Text style={styles.sectionDescription}>{section.description}</Text>
                      </View>
                      <Text style={styles.sectionCount}>
                        {`${emoteSlotsFilled}/${EQUIPPED_EMOJI_SLOT_COUNT} equipped`}
                      </Text>
                    </View>

                    <View style={styles.slotCardList}>
                      {equippedEmoteCosmetics.map((item, index) => (
                        <View key={`emote-slot-${index}`} style={styles.slotCard}>
                          <View style={styles.slotCardText}>
                            <Text style={styles.slotLabel}>Slot {index + 1}</Text>
                            <Text style={styles.slotValue}>{item?.name ?? 'Empty'}</Text>
                          </View>
                          <Button
                            title={item ? 'Remove' : 'Empty'}
                            variant="outline"
                            disabled={!item}
                            onPress={() => {
                              void unequipEmoteSlot(index);
                            }}
                            style={styles.slotButton}
                          />
                        </View>
                      ))}
                    </View>

                    {items.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyStateTitle}>No assets yet</Text>
                        <Text style={styles.emptyStateText}>
                          Buy or unlock emojis to fill the reaction wheel.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.itemList}>
                        {items.map((item) => (
                          <InventoryItemCard
                            key={item.id}
                            title={item.name}
                            typeLabel={item.tier.toUpperCase()}
                            isEquipped={item.isEquipped}
                            onEquip={() => {
                              void equipCosmetic(item);
                            }}
                            onUnequip={() => {
                              void unequipEmoteCosmetic(item.id);
                            }}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                );
              }

              return (
                <View key={section.type} style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderText}>
                      <Text style={styles.sectionTitle}>{section.label}</Text>
                      <Text style={styles.sectionDescription}>{section.description}</Text>
                    </View>
                    <Text style={styles.sectionCount}>{items.length} owned</Text>
                  </View>

                  {items.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateTitle}>No assets yet</Text>
                      <Text style={styles.emptyStateText}>
                        Buy or unlock {section.label.toLowerCase()} to add them here.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.itemList}>
                      {items.map((item) => (
                        <InventoryItemCard
                          key={item.id}
                          title={item.name}
                          typeLabel={item.tier.toUpperCase()}
                          isEquipped={equippedItem?.id === item.id}
                          onEquip={() => {
                            void equipCosmetic(item);
                          }}
                          onUnequip={() => {
                            void unequipCosmetic(section.type);
                          }}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#25160F',
  },
  content: {
    paddingHorizontal: urTheme.spacing.md,
    paddingTop: urTheme.spacing.lg,
    paddingBottom: urTheme.spacing.xl,
    gap: urTheme.spacing.md,
  },
  header: {
    gap: 6,
  },
  kicker: {
    ...urTextVariants.caption,
    color: '#E4C68C',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  title: {
    ...urTextVariants.displayTitle,
    color: urTheme.colors.parchment,
  },
  subtitle: {
    ...urTextVariants.body,
    color: 'rgba(255, 245, 222, 0.82)',
  },
  summaryCard: {
    gap: 10,
    borderRadius: 24,
    padding: urTheme.spacing.md,
    backgroundColor: 'rgba(78, 44, 20, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 226, 150, 0.22)',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: urTheme.spacing.md,
  },
  summaryLabel: {
    ...urTypography.label,
    color: '#E7C77D',
    flexShrink: 0,
  },
  summaryValue: {
    ...urTextVariants.body,
    color: urTheme.colors.parchment,
    flexShrink: 1,
    textAlign: 'right',
  },
  summaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 6,
  },
  summaryButton: {
    minWidth: 128,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 180,
    borderRadius: 24,
    backgroundColor: 'rgba(78, 44, 20, 0.65)',
  },
  loadingText: {
    ...urTextVariants.body,
    color: urTheme.colors.parchment,
  },
  errorCard: {
    gap: 12,
    borderRadius: 24,
    padding: urTheme.spacing.md,
    backgroundColor: 'rgba(94, 28, 20, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 168, 168, 0.32)',
  },
  errorTitle: {
    ...urTextVariants.sectionTitle,
    color: '#FFD9D5',
  },
  errorText: {
    ...urTextVariants.body,
    color: '#FFE9E7',
  },
  errorButton: {
    alignSelf: 'flex-start',
    minWidth: 136,
  },
  sectionCard: {
    gap: 12,
    borderRadius: 26,
    padding: urTheme.spacing.md,
    backgroundColor: 'rgba(39, 25, 18, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 226, 150, 0.16)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: urTheme.spacing.md,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    ...urTextVariants.sectionTitle,
    color: urTheme.colors.parchment,
  },
  sectionDescription: {
    ...urTextVariants.body,
    color: 'rgba(255, 245, 222, 0.75)',
  },
  sectionCount: {
    ...urTypography.label,
    color: '#E7C77D',
    flexShrink: 0,
  },
  emptyState: {
    gap: 6,
    borderRadius: 18,
    padding: urTheme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  emptyStateTitle: {
    ...urTextVariants.sectionTitle,
    color: urTheme.colors.parchment,
  },
  emptyStateText: {
    ...urTextVariants.body,
    color: 'rgba(255, 245, 222, 0.78)',
  },
  itemList: {
    gap: 10,
  },
  slotCardList: {
    gap: 10,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
    borderRadius: 18,
    padding: urTheme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  slotCardText: {
    flex: 1,
    gap: 4,
  },
  slotLabel: {
    ...urTypography.label,
    color: '#D8BF8A',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  slotValue: {
    ...urTextVariants.body,
    color: urTheme.colors.parchment,
  },
  slotButton: {
    minWidth: 112,
  },
  itemCard: {
    gap: 10,
    borderRadius: 20,
    padding: urTheme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
  },
  itemTitle: {
    ...urTextVariants.cardTitle,
    color: urTheme.colors.parchment,
    flex: 1,
  },
  itemType: {
    ...urTypography.label,
    color: '#D8BF8A',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  itemStatus: {
    ...urTextVariants.body,
    color: 'rgba(255, 245, 222, 0.82)',
  },
  itemActions: {
    alignItems: 'flex-start',
  },
  itemButton: {
    minWidth: 132,
  },
});
