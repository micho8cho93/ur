import { CHALLENGE_DEFINITIONS } from "../../shared/challenges";
import { ensureChallengeDefinitions } from "./challenges";

describe("ensureChallengeDefinitions", () => {
  it("publishes the configured challenge reward values", () => {
    const rewardsById = Object.fromEntries(
      CHALLENGE_DEFINITIONS.map((definition) => [definition.id, definition.rewardXp])
    );

    expect(rewardsById.first_victory).toBe(50);
    expect(rewardsById.beat_easy_bot).toBe(30);
    expect(rewardsById.fast_finish).toBe(150);
    expect(rewardsById.safe_play).toBe(150);
    expect(rewardsById.lucky_roll).toBe(100);
    expect(rewardsById.home_stretch).toBe(150);
    expect(rewardsById.capture_master).toBe(150);
    expect(rewardsById.beat_medium_bot).toBe(100);
    expect(rewardsById.beat_hard_bot).toBe(150);
    expect(rewardsById.beat_perfect_bot).toBe(250);
  });

  it("retries after a version conflict and succeeds once the definitions are already synced", () => {
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
    };

    const staleObjects = CHALLENGE_DEFINITIONS.map((definition) => ({
      collection: "challenge_definitions",
      key: definition.id,
      value: {
        ...definition,
        rewardXp: definition.rewardXp + 1,
      },
      version: `v-${definition.id}`,
    }));

    const syncedObjects = CHALLENGE_DEFINITIONS.map((definition) => ({
      collection: "challenge_definitions",
      key: definition.id,
      value: {
        ...definition,
        syncedAt: "2026-03-19T20:00:00.000Z",
      },
      version: `v2-${definition.id}`,
    }));

    const nk = {
      storageRead: jest
        .fn()
        .mockReturnValueOnce(staleObjects)
        .mockReturnValueOnce(syncedObjects),
      storageWrite: jest.fn().mockImplementationOnce(() => {
        throw new Error("Storage write rejected - version check failed.");
      }),
    };

    expect(() => ensureChallengeDefinitions(nk, logger)).not.toThrow();
    expect(nk.storageRead).toHaveBeenCalledTimes(2);
    expect(nk.storageWrite).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      "Challenge definition sync attempt %d/%d failed: %s",
      1,
      4,
      "Storage write rejected - version check failed."
    );
  });
});
