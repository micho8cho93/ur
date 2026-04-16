import type { CosmeticDefinition } from "../../shared/cosmetics";
import { getCatalog } from "./cosmeticCatalog";
import { getDailyRotation, getFeaturedItems } from "./storeRotation";

const createCosmetic = (
  id: string,
  type: CosmeticDefinition["type"],
  rarityWeight: number,
): CosmeticDefinition => ({
  id,
  name: id,
  tier: "common",
  type,
  price: { currency: "soft", amount: 100 },
  rotationPools: ["daily"],
  rarityWeight,
  releasedDate: "2026-04-15T00:00:00.000Z",
  assetKey: id,
});

describe("cosmetic catalog and store rotation", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("seeds at least 16 cosmetics across all types and multiple tiers", () => {
    const catalog = getCatalog();

    expect(catalog.length).toBeGreaterThanOrEqual(16);
    expect(new Set(catalog.map((item) => item.type))).toEqual(
      new Set(["board", "pieces", "dice_animation", "emote", "music", "sound_effect"]),
    );
    expect(new Set(catalog.map((item) => item.tier)).size).toBeGreaterThanOrEqual(3);
  });

  it("returns exactly 8 daily items with type diversity and no yesterday duplicates", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const catalog = getCatalog();
    const yesterday = [
      "board_cedar_001",
      "pieces_ivory_001",
      "dice_clay_001",
      "emote_scribe_001",
      "board_alabaster_001",
      "pieces_bronze_001",
      "dice_copper_001",
      "emote_lyre_001",
    ];

    const rotation = getDailyRotation(catalog, "2026-04-15T12:00:00.000Z", [yesterday]);

    expect(rotation).toHaveLength(8);
    expect(rotation.some((item) => item.type === "board")).toBe(true);
    expect(rotation.some((item) => item.type === "pieces")).toBe(true);
    expect(
      rotation.some(
        (item) =>
          item.type === "dice_animation" ||
          item.type === "emote" ||
          item.type === "music" ||
          item.type === "sound_effect",
      ),
    ).toBe(true);
    expect(rotation.some((item) => yesterday.includes(item.id))).toBe(false);
  });

  it("repairs a weighted sample that misses animation or emote items", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const catalog = [
      createCosmetic("board-1", "board", 1),
      createCosmetic("board-2", "board", 1),
      createCosmetic("board-3", "board", 1),
      createCosmetic("board-4", "board", 1),
      createCosmetic("pieces-1", "pieces", 1),
      createCosmetic("pieces-2", "pieces", 1),
      createCosmetic("pieces-3", "pieces", 1),
      createCosmetic("pieces-4", "pieces", 1),
      createCosmetic("dice-1", "dice_animation", 0.1),
    ];

    const rotation = getDailyRotation(catalog, "2026-04-15T12:00:00.000Z", []);

    expect(rotation).toHaveLength(8);
    expect(rotation.some((item) => item.type === "dice_animation")).toBe(true);
  });

  it("deprioritizes items from older rotations by halving their weight", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.42);
    const catalog = [
      createCosmetic("older-board", "board", 0.8),
      createCosmetic("fresh-board", "board", 0.5),
      createCosmetic("pieces-1", "pieces", 0.01),
      createCosmetic("pieces-2", "pieces", 0.01),
      createCosmetic("pieces-3", "pieces", 0.01),
      createCosmetic("dice-1", "dice_animation", 0.01),
      createCosmetic("dice-2", "dice_animation", 0.01),
      createCosmetic("emote-1", "emote", 0.01),
      createCosmetic("emote-2", "emote", 0.01),
    ];

    const rotation = getDailyRotation(catalog, "2026-04-15T12:00:00.000Z", [[], ["older-board"]]);

    expect(rotation[0]?.id).toBe("fresh-board");
  });

  it("returns active Epic and Legendary featured items", () => {
    const featured = getFeaturedItems(getCatalog());

    expect(featured.length).toBeGreaterThanOrEqual(1);
    expect(featured.length).toBeLessThanOrEqual(2);
    expect(featured.every((item) => item.tier === "epic" || item.tier === "legendary")).toBe(true);
  });
});
