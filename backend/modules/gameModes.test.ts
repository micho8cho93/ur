import { ADMIN_COLLECTION, ADMIN_ROLE_KEY } from './tournaments/auth'
import { GLOBAL_STORAGE_USER_ID } from './progression'
import {
  getPublicGameModes,
  rpcAdminDisableGameMode,
  rpcAdminFeatureGameMode,
  rpcAdminGetGameMode,
  rpcAdminListGameModes,
  rpcAdminUnfeatureGameMode,
  rpcAdminUpsertGameMode,
  rpcGetGameModes,
} from './gameModes'

type StoredObject = {
  collection: string
  key: string
  userId?: string
  value: unknown
  version: string
}

type StorageReadRequest = {
  collection: string
  key: string
  userId?: string
}

type StorageWriteRequest = {
  collection: string
  key: string
  userId?: string
  value: unknown
  version?: string
}

const buildStorageKey = (collection: string, key: string, userId = ''): string => `${collection}:${key}:${userId}`

const createLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
})

const createNakama = () => {
  const storage = new Map<string, StoredObject>()
  let versionCounter = 1

  const storageRead = jest.fn((requests: StorageReadRequest[]) =>
    requests
      .map((request) => {
        const direct = storage.get(buildStorageKey(request.collection, request.key, request.userId ?? ''))
        if (direct) {
          return direct
        }

        if (!request.userId) {
          return storage.get(buildStorageKey(request.collection, request.key, GLOBAL_STORAGE_USER_ID))
        }

        return undefined
      })
      .filter((entry): entry is StoredObject => Boolean(entry)),
  )

  const storageWrite = jest.fn((writes: StorageWriteRequest[]) => {
    writes.forEach((write) => {
      const storageKey = buildStorageKey(write.collection, write.key, write.userId ?? '')
      const existing = storage.get(storageKey)

      if (typeof write.version === 'string' && write.version.length > 0 && write.version !== '*') {
        if (!existing || existing.version !== write.version) {
          throw new Error(`Storage version mismatch for ${storageKey}`)
        }
      }

      storage.set(storageKey, {
        collection: write.collection,
        key: write.key,
        userId: write.userId,
        value: write.value,
        version: `v${versionCounter++}`,
      })
    })
  })

  return {
    storage,
    storageRead,
    storageWrite,
  }
}

const seedAdminRole = (nk: ReturnType<typeof createNakama>, userId = 'admin-1', role = 'operator') => {
  nk.storage.set(buildStorageKey(ADMIN_COLLECTION, ADMIN_ROLE_KEY, userId), {
    collection: ADMIN_COLLECTION,
    key: ADMIN_ROLE_KEY,
    userId,
    value: { role },
    version: 'admin-v1',
  })
}

const upsertMode = (
  nk: ReturnType<typeof createNakama>,
  logger: ReturnType<typeof createLogger>,
  mode: {
    id: string
    name: string
    description: string
    baseRulesetPreset: 'quick_play' | 'race' | 'finkel_rules' | 'capture' | 'custom'
    pieceCountPerSide: number
    rulesVariant: 'standard' | 'capture' | 'no-capture'
    rosetteSafetyMode: 'standard' | 'open'
    exitStyle: 'standard' | 'single_exit'
    eliminationMode: 'return_to_start' | 'eliminated'
    fogOfWar: boolean
    boardAssetKey: 'board_design' | 'board_single_exit'
    isActive: boolean
  },
) =>
  JSON.parse(
    rpcAdminUpsertGameMode(
      { userId: 'admin-1' },
      logger,
      nk,
      JSON.stringify({ mode }),
    ),
  ) as {
    success: true
    mode: {
      id: string
      featured: boolean
      isActive: boolean
    }
  }

describe('gameModes catalog RPCs', () => {
  it('persists CRUD updates and surfaces public/admin payloads', () => {
    const nk = createNakama()
    const logger = createLogger()
    seedAdminRole(nk)

    upsertMode(nk, logger, {
      id: 'moonlight_sprint',
      name: 'Moonlight Sprint',
      description: 'Fogged custom mode',
      baseRulesetPreset: 'custom',
      pieceCountPerSide: 7,
      rulesVariant: 'standard',
      rosetteSafetyMode: 'standard',
      exitStyle: 'single_exit',
      eliminationMode: 'return_to_start',
      fogOfWar: true,
      boardAssetKey: 'board_single_exit',
      isActive: true,
    })
    upsertMode(nk, logger, {
      id: 'ember_trial',
      name: 'Ember Trial',
      description: 'Capture-focused mode',
      baseRulesetPreset: 'capture',
      pieceCountPerSide: 5,
      rulesVariant: 'capture',
      rosetteSafetyMode: 'open',
      exitStyle: 'standard',
      eliminationMode: 'eliminated',
      fogOfWar: false,
      boardAssetKey: 'board_design',
      isActive: false,
    })

    const adminList = JSON.parse(rpcAdminListGameModes({ userId: 'admin-1' }, logger, nk, '')) as {
      featuredModeId: string | null
      modes: Array<{ id: string; featured: boolean; isActive: boolean }>
    }
    const adminMode = JSON.parse(rpcAdminGetGameMode({ userId: 'admin-1' }, logger, nk, JSON.stringify({ modeId: 'moonlight_sprint' }))) as {
      success: true
      mode: { id: string; name: string; featured: boolean; isActive: boolean }
    }
    const publicPayload = JSON.parse(rpcGetGameModes({ userId: 'player-1' }, logger, nk, '')) as {
      featuredMode: { id: string } | null
      activeModes: Array<{ id: string }>
    }

    expect(adminList.featuredModeId).toBe('moonlight_sprint')
    expect(adminList.modes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'moonlight_sprint', featured: true, isActive: true }),
        expect.objectContaining({ id: 'ember_trial', featured: false, isActive: false }),
      ]),
    )
    expect(adminMode.mode).toEqual(expect.objectContaining({ id: 'moonlight_sprint', featured: true }))
    expect(publicPayload.featuredMode).toEqual(expect.objectContaining({ id: 'moonlight_sprint' }))
    expect(publicPayload.activeModes.map((mode) => mode.id)).toEqual(['moonlight_sprint'])

    expect(getPublicGameModes(nk)).toEqual(
      expect.objectContaining({
        featuredMode: expect.objectContaining({ id: 'moonlight_sprint' }),
        activeModes: expect.arrayContaining([expect.objectContaining({ id: 'moonlight_sprint' })]),
      }),
    )
  })

  it('keeps exactly one featured mode after feature and unfeature mutations', () => {
    const nk = createNakama()
    const logger = createLogger()
    seedAdminRole(nk)

    upsertMode(nk, logger, {
      id: 'moonlight_sprint',
      name: 'Moonlight Sprint',
      description: 'Fogged custom mode',
      baseRulesetPreset: 'custom',
      pieceCountPerSide: 7,
      rulesVariant: 'standard',
      rosetteSafetyMode: 'standard',
      exitStyle: 'single_exit',
      eliminationMode: 'return_to_start',
      fogOfWar: true,
      boardAssetKey: 'board_single_exit',
      isActive: true,
    })
    upsertMode(nk, logger, {
      id: 'ember_trial',
      name: 'Ember Trial',
      description: 'Capture-focused mode',
      baseRulesetPreset: 'capture',
      pieceCountPerSide: 5,
      rulesVariant: 'capture',
      rosetteSafetyMode: 'open',
      exitStyle: 'standard',
      eliminationMode: 'eliminated',
      fogOfWar: false,
      boardAssetKey: 'board_design',
      isActive: true,
    })

    const featured = JSON.parse(
      rpcAdminFeatureGameMode({ userId: 'admin-1' }, logger, nk, JSON.stringify({ modeId: 'ember_trial' })),
    ) as { success: true; featuredModeId: string | null }
    expect(featured.featuredModeId).toBe('ember_trial')

    const unfeatured = JSON.parse(
      rpcAdminUnfeatureGameMode({ userId: 'admin-1' }, logger, nk, JSON.stringify({ modeId: 'ember_trial' })),
    ) as { success: true; featuredModeId: string | null }
    expect(unfeatured.featuredModeId).toBe('moonlight_sprint')

    const catalog = JSON.parse(rpcAdminListGameModes({ userId: 'admin-1' }, logger, nk, '')) as {
      featuredModeId: string | null
      modes: Array<{ id: string; featured: boolean }>
    }
    expect(catalog.featuredModeId).toBe('moonlight_sprint')
    expect(catalog.modes.filter((mode) => mode.featured)).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'moonlight_sprint', featured: true })]),
    )
  })

  it('filters public payloads to active modes while keeping the featured mode payload', () => {
    const nk = createNakama()
    const logger = createLogger()
    seedAdminRole(nk)

    upsertMode(nk, logger, {
      id: 'moonlight_sprint',
      name: 'Moonlight Sprint',
      description: 'Fogged custom mode',
      baseRulesetPreset: 'custom',
      pieceCountPerSide: 7,
      rulesVariant: 'standard',
      rosetteSafetyMode: 'standard',
      exitStyle: 'single_exit',
      eliminationMode: 'return_to_start',
      fogOfWar: true,
      boardAssetKey: 'board_single_exit',
      isActive: true,
    })
    upsertMode(nk, logger, {
      id: 'ember_trial',
      name: 'Ember Trial',
      description: 'Capture-focused mode',
      baseRulesetPreset: 'capture',
      pieceCountPerSide: 5,
      rulesVariant: 'capture',
      rosetteSafetyMode: 'open',
      exitStyle: 'standard',
      eliminationMode: 'eliminated',
      fogOfWar: false,
      boardAssetKey: 'board_design',
      isActive: true,
    })

    JSON.parse(
      rpcAdminDisableGameMode({ userId: 'admin-1' }, logger, nk, JSON.stringify({ modeId: 'moonlight_sprint' })),
    )

    const publicPayload = JSON.parse(rpcGetGameModes({ userId: 'player-1' }, logger, nk, '')) as {
      featuredMode: { id: string } | null
      activeModes: Array<{ id: string }>
    }

    expect(publicPayload.featuredMode).toEqual(expect.objectContaining({ id: 'moonlight_sprint' }))
    expect(publicPayload.activeModes.map((mode) => mode.id)).toEqual(['ember_trial'])
  })
})
