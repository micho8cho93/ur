import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { Stack, useRouter } from 'expo-router';

import { CosmeticPreviewModal } from '@/components/CosmeticPreviewModal';
import { Button } from '@/components/ui/Button';
import { CurrencyAmount, type CurrencyIconVariant } from '@/components/wallet/CurrencyIcon';
import { getFullCatalog } from '@/services/cosmetics';
import type { CosmeticDefinition, CosmeticTier } from '@/shared/cosmetics';
import { useStore } from '@/src/store/StoreProvider';

const tierColors: Record<CosmeticTier, { bg: string; text: string; thumb: string; border: string }> = {
  common: { bg: '#475569', text: '#f8fafc', thumb: '#64748b', border: 'rgba(100, 116, 139, 0.65)' },
  rare: { bg: '#1d4ed8', text: '#dbeafe', thumb: '#2563eb', border: 'rgba(37, 99, 235, 0.65)' },
  epic: { bg: '#7e22ce', text: '#f3e8ff', thumb: '#9333ea', border: 'rgba(147, 51, 234, 0.65)' },
  legendary: { bg: '#b45309', text: '#fef3c7', thumb: '#d97706', border: 'rgba(217, 119, 6, 0.65)' },
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

const formatCountdown = (expiresAt: string): string => {
  const remainingMs = Math.max(0, Date.parse(expiresAt) - Date.now());
  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const getPurchaseErrorMessage = (error: string): string => {
  if (error === 'INSUFFICIENT_FUNDS') {
    return 'Not enough balance';
  }
  if (error === 'ALREADY_OWNED') {
    return 'Already owned';
  }
  return 'Purchase failed';
};

type StoreTabId = 'featured' | 'board' | 'pieces' | 'dice_animation' | 'emote';
type CurrencyFilter = 'all' | 'soft' | 'premium';
type ToastState = {
  message: string;
  type: 'success' | 'error';
  action?: { label: string; onPress: () => void };
} | null;

const STORE_TABS: { id: StoreTabId; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'board', label: 'Boards' },
  { id: 'pieces', label: 'Pieces' },
  { id: 'dice_animation', label: 'Dice' },
  { id: 'emote', label: 'Emotes' },
];

const CURRENCY_FILTERS: { id: CurrencyFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'soft', label: 'Coins' },
  { id: 'premium', label: 'Gems' },
];

const tierRank: Record<CosmeticTier, number> = {
  legendary: 4,
  epic: 3,
  rare: 2,
  common: 1,
};

const sortCatalogItems = (items: CosmeticDefinition[], ownedIds: Set<string>): CosmeticDefinition[] =>
  [...items].sort((left, right) => {
    const leftOwned = ownedIds.has(left.id);
    const rightOwned = ownedIds.has(right.id);
    if (leftOwned !== rightOwned) {
      return leftOwned ? 1 : -1;
    }

    const tierDelta = tierRank[right.tier] - tierRank[left.tier];
    if (tierDelta !== 0) {
      return tierDelta;
    }

    return left.name.localeCompare(right.name);
  });

type CosmeticCardProps = {
  item: CosmeticDefinition;
  owned: boolean;
  canAfford: boolean;
  featured?: boolean;
  inRotation?: boolean;
  onPreview?: () => void;
  onBuy: (item: CosmeticDefinition) => void;
};

const TierBadge = ({ tier }: { tier: CosmeticTier }) => (
  <View style={[styles.tierBadge, { backgroundColor: tierColors[tier].bg }]}>
    <Text style={[styles.tierText, { color: tierColors[tier].text }]}>{tier.toUpperCase()}</Text>
  </View>
);

const CosmeticCard = ({ item, owned, canAfford, featured = false, inRotation = false, onPreview, onBuy }: CosmeticCardProps) => (
  <View style={[
    styles.card,
    featured ? styles.featuredCard : styles.dailyCard,
    { borderColor: tierColors[item.tier].border },
    (!canAfford && !owned) ? styles.cardUnaffordable : null,
  ]}>
    <View style={[styles.thumbnail, featured ? styles.featuredThumbnail : null, { backgroundColor: tierColors[item.tier].thumb }]}>
      <Text style={styles.thumbnailText}>{item.type.replace('_', ' ')}</Text>
      {owned ? (
        <View style={styles.ownedOverlay}>
          <Text style={styles.ownedOverlayText}>✓ Owned</Text>
        </View>
      ) : null}
    </View>
    <View style={styles.cardBody}>
      <View style={styles.cardTitleRow}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
      </View>
      <TierBadge tier={item.tier} />
      {inRotation ? <Text style={styles.rotationTag}>In rotation today</Text> : null}
      {!owned ? (
        <PriceAmount
          item={item}
          style={styles.price}
          textStyle={[styles.priceText, !canAfford ? styles.priceTextUnaffordable : null]}
        />
      ) : null}
      <View style={styles.cardActions}>
        {onPreview ? (
          <Button title="Preview" variant="outline" onPress={onPreview} style={styles.smallButton} />
        ) : null}
        <Button
          title={owned ? 'Owned' : 'Buy'}
          disabled={owned}
          onPress={() => onBuy(item)}
          style={styles.smallButton}
        />
      </View>
    </View>
  </View>
);

export default function StoreScreen() {
  const router = useRouter();
  const { storefront, softCurrency, loading, errorMessage, purchaseItem, refresh } = useStore();
  const [selectedTab, setSelectedTab] = useState<StoreTabId>('featured');
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>('all');
  const [catalogItems, setCatalogItems] = useState<CosmeticDefinition[] | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CosmeticDefinition | null>(null);
  const [purchaseSucceeded, setPurchaseSucceeded] = useState(false);
  const [previewCosmetic, setPreviewCosmetic] = useState<CosmeticDefinition | null>(null);
  const [previewRelatedCosmetics, setPreviewRelatedCosmetics] = useState<CosmeticDefinition[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [countdownTick, setCountdownTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCountdownTick((tick) => tick + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const loadCatalog = React.useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);

    try {
      const response = await getFullCatalog();
      setCatalogItems(response.items);
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'Catalog unavailable');
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const duration = toast.type === 'error' ? 4_000 : 2_500;
    const timeout = setTimeout(() => setToast(null), duration);
    return () => clearTimeout(timeout);
  }, [toast]);

  const ownedIds = useMemo(() => new Set(storefront?.ownedIds ?? []), [storefront?.ownedIds]);
  const rotationIds = useMemo(
    () => new Set(storefront?.dailyRotation.map((item) => item.id) ?? []),
    [storefront?.dailyRotation],
  );
  const categoryItems = useMemo(() => {
    if (!catalogItems || selectedTab === 'featured') {
      return [];
    }

    const filtered = catalogItems.filter((item) => {
      if (item.disabled || item.type !== selectedTab) return false;
      if (currencyFilter !== 'all' && item.price.currency !== currencyFilter) return false;
      return true;
    });

    return sortCatalogItems(filtered, ownedIds);
  }, [catalogItems, currencyFilter, ownedIds, selectedTab]);
  const countdown = storefront ? formatCountdown(storefront.rotationExpiresAt) : '0h 0m';
  void countdownTick;

  const canAffordItem = (item: CosmeticDefinition): boolean => {
    if (item.price.currency === 'premium') return true;
    return softCurrency >= item.price.amount;
  };

  const dismissSheet = () => {
    setSelectedItem(null);
    setPurchaseSucceeded(false);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedItem || purchaseLoading) {
      return;
    }

    setPurchaseLoading(true);
    const result = await purchaseItem(selectedItem.id);
    setPurchaseLoading(false);

    if (result.success) {
      setPurchaseSucceeded(true);
      return;
    }

    setToast({ message: getPurchaseErrorMessage(result.error), type: 'error' });
    dismissSheet();
  };

  const openPreview = (item: CosmeticDefinition, sectionItems: CosmeticDefinition[]) => {
    setPreviewCosmetic(item);
    setPreviewRelatedCosmetics(sectionItems.filter((sectionItem) => sectionItem.id !== item.id));
    setPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setTimeout(() => {
      setPreviewCosmetic(null);
      setPreviewRelatedCosmetics([]);
    }, 100);
  };

  const handlePreviewPurchase = async (item: CosmeticDefinition) => {
    if (purchaseLoading) {
      return;
    }

    closePreview();
    setPurchaseLoading(true);
    const result = await purchaseItem(item.id);
    setPurchaseLoading(false);

    if (result.success) {
      setToast({
        message: `You own ${item.name}!`,
        type: 'success',
        action: {
          label: 'Equip Now',
          onPress: () => {
            setToast(null);
            router.push('/(game)/inventory');
          },
        },
      });
      return;
    }

    setToast({ message: getPurchaseErrorMessage(result.error), type: 'error' });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Store' }} />
      <SafeAreaView className="flex-1 bg-slate-900" edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Store</Text>
            <View style={styles.walletPill}>
              <CurrencyAmount
                amount={softCurrency}
                variant="coin"
                iconSize={15}
                textStyle={styles.walletText}
              />
            </View>
          </View>

          {toast ? (
            <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
              <Text style={styles.toastText}>{toast.message}</Text>
              {toast.action ? (
                <Pressable onPress={toast.action.onPress} style={styles.toastAction}>
                  <Text style={styles.toastActionText}>{toast.action.label} →</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            {STORE_TABS.map((tab) => {
              const active = selectedTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.tabButton, active ? styles.tabButtonActive : null]}
                  onPress={() => setSelectedTab(tab.id)}
                >
                  <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {selectedTab !== 'featured' ? (
            <View style={styles.filterRow}>
              {CURRENCY_FILTERS.map((filter) => {
                const active = currencyFilter === filter.id;
                return (
                  <Pressable
                    key={filter.id}
                    accessibilityRole="button"
                    onPress={() => setCurrencyFilter(filter.id)}
                    style={[styles.filterChip, active ? styles.filterChipActive : null]}
                  >
                    <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {selectedTab === 'featured' && loading && !storefront ? (
            <View style={styles.statePanel}>
              <ActivityIndicator color="#facc15" />
              <Text style={styles.stateText}>Opening the store...</Text>
            </View>
          ) : selectedTab === 'featured' && errorMessage && !storefront ? (
            <View style={styles.statePanel}>
              <Text style={styles.stateTitle}>Store unavailable</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <Button title="Try Again" onPress={() => void refresh()} />
            </View>
          ) : selectedTab === 'featured' && storefront ? (
            <>
              {storefront.featured.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Featured</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
                    {storefront.featured.map((item) => (
                      <CosmeticCard
                        key={item.id}
                        item={item}
                        owned={ownedIds.has(item.id)}
                        canAfford={canAffordItem(item)}
                        featured
                        inRotation={rotationIds.has(item.id)}
                        onPreview={() => openPreview(item, storefront.featured)}
                        onBuy={setSelectedItem}
                      />
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Daily — refreshes in {countdown}</Text>
                <View style={styles.dailyGrid}>
                  {storefront.dailyRotation.map((item) => (
                      <CosmeticCard
                        key={item.id}
                        item={item}
                        owned={ownedIds.has(item.id)}
                        canAfford={canAffordItem(item)}
                        inRotation={rotationIds.has(item.id)}
                        onPreview={() => openPreview(item, storefront.dailyRotation)}
                        onBuy={setSelectedItem}
                      />
                  ))}
                </View>
              </View>
            </>
          ) : selectedTab !== 'featured' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {STORE_TABS.find((tab) => tab.id === selectedTab)?.label ?? 'Catalog'}
              </Text>
              {catalogLoading && !catalogItems ? (
                <View style={styles.statePanel}>
                  <ActivityIndicator color="#facc15" />
                  <Text style={styles.stateText}>Loading the catalog...</Text>
                </View>
              ) : catalogError && !catalogItems ? (
                <View style={styles.statePanel}>
                  <Text style={styles.stateTitle}>Catalog unavailable</Text>
                  <Text style={styles.stateText}>{catalogError}</Text>
                  <Button title="Try Again" onPress={() => void loadCatalog()} />
                </View>
              ) : categoryItems.length > 0 ? (
                <View style={styles.dailyGrid}>
                  {categoryItems.map((item) => (
                    <CosmeticCard
                      key={item.id}
                      item={item}
                      owned={ownedIds.has(item.id)}
                      canAfford={canAffordItem(item)}
                      inRotation={rotationIds.has(item.id)}
                      onPreview={() => openPreview(item, categoryItems)}
                      onBuy={setSelectedItem}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.statePanel}>
                  <Text style={styles.stateTitle}>Nothing here yet</Text>
                  <Text style={styles.stateText}>Check back after the next catalog update.</Text>
                  {catalogError ? <Button title="Try Again" onPress={() => void loadCatalog()} /> : null}
                </View>
              )}
            </View>
          ) : null}
        </ScrollView>

        <Modal transparent visible={Boolean(selectedItem)} animationType="slide" onRequestClose={dismissSheet}>
          <Pressable style={styles.sheetBackdrop} onPress={dismissSheet}>
            <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
              {selectedItem ? (
                purchaseSucceeded ? (
                  <>
                    <View style={[styles.sheetThumbnail, { backgroundColor: tierColors[selectedItem.tier].thumb }]}>
                      <Text style={styles.sheetSuccessCheck}>✓</Text>
                    </View>
                    <Text style={styles.sheetTitle}>{selectedItem.name}</Text>
                    <Text style={styles.sheetSuccessLabel}>Added to your collection!</Text>
                    <View style={styles.sheetActions}>
                      <Button title="Keep Shopping" variant="outline" onPress={dismissSheet} style={styles.sheetButton} />
                      <Button
                        title="Equip Now"
                        onPress={() => {
                          dismissSheet();
                          router.push('/(game)/inventory');
                        }}
                        style={styles.sheetButton}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <View style={[styles.sheetThumbnail, { backgroundColor: tierColors[selectedItem.tier].thumb }]} />
                    <Text style={styles.sheetTitle}>{selectedItem.name}</Text>
                    <PriceAmount
                      item={selectedItem}
                      style={styles.sheetPrice}
                      textStyle={styles.sheetPriceText}
                    />
                    <View style={styles.sheetActions}>
                      <Button title="Cancel" variant="outline" onPress={dismissSheet} style={styles.sheetButton} />
                      <Button
                        title="Confirm"
                        loading={purchaseLoading}
                        onPress={() => void handleConfirmPurchase()}
                        style={styles.sheetButton}
                      />
                    </View>
                  </>
                )
              ) : null}
            </Pressable>
          </Pressable>
        </Modal>
        <CosmeticPreviewModal
          visible={previewVisible}
          cosmetic={previewCosmetic}
          onClose={closePreview}
          onBuy={(item) => void handlePreviewPurchase(item)}
          ownedIds={ownedIds}
          relatedCosmetics={previewRelatedCosmetics}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  title: {
    color: '#f8fafc',
    fontSize: 34,
    fontWeight: '800',
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.42)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  walletText: {
    color: '#fef3c7',
    fontSize: 14,
    fontWeight: '700',
  },
  toast: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  toastSuccess: {
    backgroundColor: 'rgba(22, 101, 52, 0.92)',
  },
  toastError: {
    backgroundColor: 'rgba(127, 29, 29, 0.92)',
  },
  toastText: {
    color: '#dcfce7',
    fontWeight: '700',
    flex: 1,
  },
  toastAction: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  toastActionText: {
    color: '#f0fdf4',
    fontSize: 13,
    fontWeight: '800',
  },
  tabBar: {
    gap: 8,
    paddingRight: 18,
  },
  tabButton: {
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabButtonActive: {
    borderColor: 'rgba(250, 204, 21, 0.72)',
    backgroundColor: 'rgba(113, 63, 18, 0.72)',
  },
  tabText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#fef3c7',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterChipActive: {
    borderColor: 'rgba(250, 204, 21, 0.6)',
    backgroundColor: 'rgba(113, 63, 18, 0.5)',
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#fef3c7',
  },
  statePanel: {
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    padding: 18,
  },
  stateTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  stateText: {
    color: '#cbd5e1',
    textAlign: 'center',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 21,
    fontWeight: '800',
  },
  featuredRow: {
    gap: 14,
    paddingRight: 18,
  },
  dailyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  cardUnaffordable: {
    opacity: 0.55,
  },
  featuredCard: {
    width: 260,
  },
  dailyCard: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 150,
  },
  thumbnail: {
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredThumbnail: {
    height: 132,
  },
  thumbnailText: {
    color: 'rgba(255, 255, 255, 0.74)',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  ownedOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(22, 101, 52, 0.82)',
    paddingVertical: 5,
    alignItems: 'center',
  },
  ownedOverlayText: {
    color: '#bbf7d0',
    fontSize: 12,
    fontWeight: '800',
  },
  cardBody: {
    padding: 12,
    gap: 8,
  },
  cardTitleRow: {
    minHeight: 44,
    gap: 6,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  tierBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '900',
  },
  rotationTag: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(250, 204, 21, 0.14)',
    color: '#fef3c7',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  price: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  priceText: {
    color: '#fde68a',
    fontSize: 14,
    fontWeight: '800',
  },
  priceTextUnaffordable: {
    color: '#ef4444',
  },
  cardActions: {
    gap: 8,
  },
  smallButton: {
    minHeight: 46,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2, 6, 23, 0.68)',
  },
  sheet: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.32)',
    padding: 18,
    gap: 12,
  },
  sheetThumbnail: {
    height: 86,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSuccessCheck: {
    color: '#bbf7d0',
    fontSize: 36,
    fontWeight: '900',
  },
  sheetTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '900',
  },
  sheetSuccessLabel: {
    color: '#86efac',
    fontSize: 15,
    fontWeight: '700',
  },
  sheetPrice: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  sheetPriceText: {
    color: '#fde68a',
    fontSize: 16,
    fontWeight: '800',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
  },
  sheetButton: {
    flex: 1,
  },
});
