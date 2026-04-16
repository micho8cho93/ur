import type { CosmeticDefinition } from "../../shared/cosmetics";

const DAILY_ROTATION_SIZE = 8;

export const invalidateRotationCache = (): void => {
  // Rotation state is read from storage for each storefront/admin call today.
};

const isActiveOn = (definition: CosmeticDefinition, today: string): boolean => {
  if (!definition.availabilityWindow) {
    return true;
  }

  const currentTime = Date.parse(today);
  const startTime = Date.parse(definition.availabilityWindow.start);
  const endTime = Date.parse(definition.availabilityWindow.end);

  if (!Number.isFinite(currentTime) || !Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return false;
  }

  return currentTime >= startTime && currentTime <= endTime;
};

const getEffectiveWeight = (definition: CosmeticDefinition, previousRotations: string[][]): number => {
  const baseWeight = Math.max(0, definition.rarityWeight);
  const olderRotationIds = new Set([...(previousRotations[1] ?? []), ...(previousRotations[2] ?? [])]);
  return olderRotationIds.has(definition.id) ? baseWeight / 2 : baseWeight;
};

const weightedPick = (
  candidates: CosmeticDefinition[],
  previousRotations: string[][],
): CosmeticDefinition | null => {
  if (candidates.length === 0) {
    return null;
  }

  const totalWeight = candidates.reduce((total, definition) => total + getEffectiveWeight(definition, previousRotations), 0);
  if (totalWeight <= 0) {
    return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
  }

  let cursor = Math.random() * totalWeight;
  for (const candidate of candidates) {
    cursor -= getEffectiveWeight(candidate, previousRotations);
    if (cursor <= 0) {
      return candidate;
    }
  }

  return candidates[candidates.length - 1] ?? null;
};

const weightedSample = (
  candidates: CosmeticDefinition[],
  count: number,
  previousRotations: string[][],
): CosmeticDefinition[] => {
  const remaining = [...candidates];
  const selected: CosmeticDefinition[] = [];

  while (remaining.length > 0 && selected.length < count) {
    const picked = weightedPick(remaining, previousRotations);
    if (!picked) {
      break;
    }

    selected.push(picked);
    remaining.splice(remaining.findIndex((candidate) => candidate.id === picked.id), 1);
  }

  return selected;
};

const hasPreviewMedia = (items: CosmeticDefinition[]): boolean =>
  items.some(
    (item) =>
      item.type === "dice_animation" ||
      item.type === "emote" ||
      item.type === "music" ||
      item.type === "sound_effect",
  );

const selectedWouldKeepRequiredGroups = (
  selected: CosmeticDefinition[],
  candidate: CosmeticDefinition,
  replacement: CosmeticDefinition,
): boolean => {
  const remaining = selected.filter((item) => item.id !== candidate.id);
  const next = [...remaining, replacement];
  return (
    next.some((item) => item.type === "board") &&
    next.some((item) => item.type === "pieces") &&
    hasPreviewMedia(next)
  );
};

const repairTypeDiversity = (
  selected: CosmeticDefinition[],
  eligible: CosmeticDefinition[],
  previousRotations: string[][],
): CosmeticDefinition[] => {
  let repaired = [...selected];

  const missingGroups: Array<"board" | "pieces" | "animation_or_emote"> = [];
  if (!repaired.some((item) => item.type === "board")) {
    missingGroups.push("board");
  }
  if (!repaired.some((item) => item.type === "pieces")) {
    missingGroups.push("pieces");
  }
  if (!hasPreviewMedia(repaired)) {
    missingGroups.push("animation_or_emote");
  }

  for (const missingGroup of missingGroups) {
    const selectedIds = new Set(repaired.map((item) => item.id));
    const candidates = eligible.filter((item) => {
      if (selectedIds.has(item.id)) {
        return false;
      }
      if (missingGroup === "animation_or_emote") {
        return (
          item.type === "dice_animation" ||
          item.type === "emote" ||
          item.type === "music" ||
          item.type === "sound_effect"
        );
      }
      return item.type === missingGroup;
    });
    const replacement = weightedPick(candidates, previousRotations);
    if (!replacement) {
      continue;
    }

    const replaceable = [...repaired]
      .sort((a, b) => getEffectiveWeight(a, previousRotations) - getEffectiveWeight(b, previousRotations))
      .find((item) => selectedWouldKeepRequiredGroups(repaired, item, replacement));

    if (!replaceable) {
      continue;
    }

    repaired = repaired.map((item) => (item.id === replaceable.id ? replacement : item));
  }

  return repaired;
};

export const getDailyRotation = (
  catalog: CosmeticDefinition[],
  today: string,
  previousRotations: string[][],
): CosmeticDefinition[] => {
  const yesterdayIds = new Set(previousRotations[0] ?? []);
  const activeDaily = catalog.filter(
    (definition) => definition.rotationPools.includes("daily") && isActiveOn(definition, today),
  );
  const eligible = activeDaily.filter((definition) => !yesterdayIds.has(definition.id));
  const samplingPool = eligible.length >= DAILY_ROTATION_SIZE ? eligible : activeDaily;
  const selected = weightedSample(samplingPool, DAILY_ROTATION_SIZE, previousRotations);

  return repairTypeDiversity(selected, samplingPool, previousRotations).slice(0, DAILY_ROTATION_SIZE);
};

export const getFeaturedItems = (catalog: CosmeticDefinition[]): CosmeticDefinition[] => {
  const today = new Date().toISOString();
  return catalog
    .filter(
      (definition) =>
        definition.rotationPools.includes("featured") &&
        (definition.tier === "epic" || definition.tier === "legendary") &&
        isActiveOn(definition, today),
    )
    .sort((a, b) => b.rarityWeight - a.rarityWeight)
    .slice(0, 2);
};
