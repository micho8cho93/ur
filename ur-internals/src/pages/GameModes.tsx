import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import { getAdminGameModes, upsertGameMode, enableGameMode, disableGameMode, featureGameMode, unfeatureGameMode } from '../api/gameModes'
import { ActionToolbar } from '../components/ActionToolbar'
import { DataTable, type DataTableColumn } from '../components/DataTable'
import { EmptyState } from '../components/EmptyState'
import { MetaStrip, MetaStripItem } from '../components/MetaStrip'
import { PageHeader } from '../components/PageHeader'
import { SectionPanel } from '../components/SectionPanel'
import { useTopbarActions } from '../layout/TopbarActionsContext'
import { appRoutes } from '../routes'
import type {
  AdminGameMode,
  AdminGameModeDraft,
  AdminGameModesResponse,
  GameModeBaseRulesetPreset,
  GameModeBoardAssetKey,
  GameModeDefinition,
  GameModeEliminationMode,
  GameModeExitStyle,
  GameModeRosetteSafetyMode,
  GameModeToggleResponse,
} from '../types/gameModes'
import {
  GAME_MODE_PRESET_OPTIONS,
  getGameModePresetDefaults,
  resolveGameModeBaseRulesetLabel,
  resolveGameModeBoardLabel,
  resolveGameModeRulesLabel,
  resolveGameModeSummary,
} from '../../../shared/gameModes'

type GameModeEditorState = {
  id: string
  name: string
  description: string
  baseRulesetPreset: GameModeBaseRulesetPreset
  pieceCountPerSide: number
  rulesVariant: GameModeDefinition['rulesVariant']
  rosetteSafetyMode: GameModeRosetteSafetyMode
  exitStyle: GameModeExitStyle
  eliminationMode: GameModeEliminationMode
  fogOfWar: boolean
  boardAssetKey: GameModeBoardAssetKey
  isActive: boolean
}

const BOARD_OPTIONS: Array<{ value: GameModeBoardAssetKey; label: string; description: string }> = [
  {
    value: 'board_design',
    label: 'Board Design',
    description: 'Default bundled board art from assets/board/board_design.png',
  },
  {
    value: 'board_single_exit',
    label: 'Single Exit Board',
    description: 'Bundled alternate board art from assets/board/board_single_exit.png',
  },
]

const RULE_VARIANT_OPTIONS: Array<{ value: GameModeDefinition['rulesVariant']; label: string }> = [
  { value: 'standard', label: 'Standard' },
  { value: 'capture', label: 'Capture' },
  { value: 'no-capture', label: 'No Capture' },
]

const ROSETTE_OPTIONS: Array<{ value: GameModeRosetteSafetyMode; label: string }> = [
  { value: 'standard', label: 'Protected shared rosette' },
  { value: 'open', label: 'Open war tiles' },
]

const EXIT_STYLE_OPTIONS: Array<{ value: GameModeExitStyle; label: string }> = [
  { value: 'standard', label: 'Standard exit' },
  { value: 'single_exit', label: 'Single exit' },
]

const ELIMINATION_OPTIONS: Array<{ value: GameModeEliminationMode; label: string }> = [
  { value: 'return_to_start', label: 'Return to start' },
  { value: 'eliminated', label: 'Eliminated' },
]

function createDefaultForm(): GameModeEditorState {
  const defaults = getGameModePresetDefaults('custom')

  return {
    id: '',
    name: '',
    description: '',
    baseRulesetPreset: defaults.baseRulesetPreset,
    pieceCountPerSide: defaults.pieceCountPerSide,
    rulesVariant: defaults.rulesVariant,
    rosetteSafetyMode: defaults.rosetteSafetyMode,
    exitStyle: defaults.exitStyle,
    eliminationMode: defaults.eliminationMode,
    fogOfWar: defaults.fogOfWar,
    boardAssetKey: defaults.boardAssetKey,
    isActive: true,
  }
}

function formFromMode(mode: AdminGameMode): GameModeEditorState {
  return {
    id: mode.id,
    name: mode.name,
    description: mode.description,
    baseRulesetPreset: mode.baseRulesetPreset,
    pieceCountPerSide: mode.pieceCountPerSide,
    rulesVariant: mode.rulesVariant,
    rosetteSafetyMode: mode.rosetteSafetyMode,
    exitStyle: mode.exitStyle,
    eliminationMode: mode.eliminationMode,
    fogOfWar: mode.fogOfWar,
    boardAssetKey: mode.boardAssetKey,
    isActive: mode.isActive,
  }
}

function formToDraft(form: GameModeEditorState): AdminGameModeDraft {
  return {
    id: form.id.trim(),
    name: form.name.trim(),
    description: form.description.trim(),
    baseRulesetPreset: form.baseRulesetPreset,
    pieceCountPerSide: form.pieceCountPerSide,
    rulesVariant: form.rulesVariant,
    rosetteSafetyMode: form.rosetteSafetyMode,
    exitStyle: form.exitStyle,
    eliminationMode: form.eliminationMode,
    fogOfWar: form.fogOfWar,
    boardAssetKey: form.boardAssetKey,
    isActive: form.isActive,
  }
}

function previewDefinition(form: GameModeEditorState): GameModeDefinition {
  return {
    id: form.id.trim() || 'preview',
    name: form.name.trim() || 'Preview mode',
    description: form.description.trim() || 'A preview of the saved configuration.',
    baseRulesetPreset: form.baseRulesetPreset,
    pieceCountPerSide: form.pieceCountPerSide,
    rulesVariant: form.rulesVariant,
    rosetteSafetyMode: form.rosetteSafetyMode,
    exitStyle: form.exitStyle,
    eliminationMode: form.eliminationMode,
    fogOfWar: form.fogOfWar,
    boardAssetKey: form.boardAssetKey,
  }
}

function validateForm(
  form: GameModeEditorState,
  existingModeIds: string[],
  editingModeId: string | null,
): string[] {
  const errors: string[] = []
  const id = form.id.trim()
  const name = form.name.trim()
  const description = form.description.trim()

  if (!id) {
    errors.push('Mode ID is required.')
  } else if (!/^[a-z0-9][a-z0-9_-]*$/.test(id)) {
    errors.push('Mode ID must use lowercase letters, numbers, underscores, or dashes.')
  } else if (existingModeIds.includes(id) && id !== editingModeId) {
    errors.push('Mode ID already exists.')
  }

  if (!name) {
    errors.push('Name is required.')
  }

  if (!description) {
    errors.push('Description is required.')
  }

  if (!Number.isInteger(form.pieceCountPerSide) || form.pieceCountPerSide < 1) {
    errors.push('Piece count must be at least 1.')
  }

  if (!BOARD_OPTIONS.some((option) => option.value === form.boardAssetKey)) {
    errors.push('Choose a bundled board.')
  }

  return errors
}

function formatBooleanLabel(value: boolean): string {
  return value ? 'Enabled' : 'Disabled'
}

export function GameModesPage() {
  const { sessionToken } = useSession()
  const navigate = useNavigate()
  const { modeId } = useParams<{ modeId?: string }>()
  const isCreating = !modeId || modeId === 'new'
  const [catalog, setCatalog] = useState<AdminGameModesResponse | null>(null)
  const [form, setForm] = useState<GameModeEditorState>(() => createDefaultForm())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isMutatingModeId, setIsMutatingModeId] = useState<string | null>(null)
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const editingMode = useMemo(() => {
    if (!catalog || isCreating) {
      return null
    }

    return catalog.modes.find((mode) => mode.id === modeId) ?? null
  }, [catalog, isCreating, modeId])

  const existingModeIds = useMemo(() => catalog?.modes.map((mode) => mode.id) ?? [], [catalog])
  const validationErrors = useMemo(
    () => validateForm(form, existingModeIds, editingMode?.id ?? null),
    [editingMode?.id, existingModeIds, form],
  )
  const previewMode = useMemo(() => previewDefinition(form), [form])
  const summary = useMemo(() => resolveGameModeSummary(previewMode), [previewMode])
  const presetLabel = useMemo(() => resolveGameModeBaseRulesetLabel(form.baseRulesetPreset), [form.baseRulesetPreset])
  const boardLabel = useMemo(() => resolveGameModeBoardLabel(form.boardAssetKey), [form.boardAssetKey])
  const rulesLabel = useMemo(() => resolveGameModeRulesLabel(form.rulesVariant), [form.rulesVariant])

  const refresh = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await getAdminGameModes()
      setCatalog(response)

      if (isCreating) {
        setForm(createDefaultForm())
        setHasAttemptedSave(false)
        return
      }

      const nextMode = response.modes.find((mode) => mode.id === modeId) ?? null
      if (nextMode) {
        setForm(formFromMode(nextMode))
        setHasAttemptedSave(false)
      } else {
        setErrorMessage(`Game mode "${modeId}" was not found.`)
        setForm(createDefaultForm())
        setHasAttemptedSave(false)
      }
    } catch (loadError) {
      setErrorMessage(loadError instanceof Error ? loadError.message : 'Unable to load game modes.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken, modeId])

  useEffect(() => {
    if (!catalog) {
      return
    }

    if (isCreating) {
      setForm(createDefaultForm())
      return
    }

    if (editingMode) {
      setForm(formFromMode(editingMode))
    }
  }, [catalog, editingMode, isCreating])

  useTopbarActions(
    <ActionToolbar>
      <button className="button button--secondary" type="button" onClick={() => void refresh()}>
        Refresh
      </button>
      <Link className="button button--primary" to={appRoutes.gameModes.new}>
        Create mode
      </Link>
    </ActionToolbar>,
  )

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setErrorMessage(null)
    setHasAttemptedSave(true)

    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors[0] ?? 'Please fix the form errors.')
      return
    }

    setIsSaving(true)
    try {
      const saved = await upsertGameMode(formToDraft(form))
      await refresh()
      navigate(appRoutes.gameModes.edit(saved.id), { replace: true })
      setHasAttemptedSave(false)
    } catch (saveError) {
      setErrorMessage(saveError instanceof Error ? saveError.message : 'Unable to save game mode.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleActive(mode: AdminGameMode) {
    setIsMutatingModeId(mode.id)
    setErrorMessage(null)

    try {
      const response: GameModeToggleResponse = mode.isActive ? await disableGameMode(mode.id) : await enableGameMode(mode.id)
      await refresh()
      if (mode.id === editingMode?.id) {
        setForm((current) => ({ ...current, isActive: response.modeId === mode.id ? !mode.isActive : current.isActive }))
      }
    } catch (mutateError) {
      setErrorMessage(mutateError instanceof Error ? mutateError.message : 'Unable to update mode state.')
    } finally {
      setIsMutatingModeId(null)
    }
  }

  async function handleFeature(mode: AdminGameMode) {
    setIsMutatingModeId(mode.id)
    setErrorMessage(null)

    try {
      if (mode.featured) {
        await unfeatureGameMode(mode.id)
      } else {
        await featureGameMode(mode.id)
      }
      await refresh()
    } catch (mutateError) {
      setErrorMessage(mutateError instanceof Error ? mutateError.message : 'Unable to update featured mode.')
    } finally {
      setIsMutatingModeId(null)
    }
  }

  const columns: DataTableColumn<AdminGameMode>[] = [
    {
      key: 'mode',
      header: 'Mode',
      render: (mode) => (
        <div className="stack stack--compact">
          <strong>{mode.name}</strong>
          <span className="muted mono">{mode.id}</span>
          <span className="table__subline">{mode.description}</span>
        </div>
      ),
    },
    {
      key: 'configuration',
      header: 'Configuration',
      render: (mode) => (
        <div className="stack stack--compact">
          <span>{resolveGameModeSummary(mode)}</span>
          <span className="table__subline">
            {resolveGameModeBaseRulesetLabel(mode.baseRulesetPreset)} · {resolveGameModeBoardLabel(mode.boardAssetKey)}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (mode) => (
        <div className="stack stack--compact">
          <span className={mode.featured ? 'status-badge status-badge--finalized' : 'status-badge status-badge--draft'}>
            {mode.featured ? 'Featured' : 'Not featured'}
          </span>
          <span className={mode.isActive ? 'status-badge status-badge--open' : 'status-badge status-badge--closed'}>
            {formatBooleanLabel(mode.isActive)}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (mode) => (
        <div className="action-toolbar action-toolbar--compact">
          <Link className="button button--secondary" to={appRoutes.gameModes.edit(mode.id)}>
            Edit
          </Link>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => void handleFeature(mode)}
            disabled={isMutatingModeId === mode.id}
          >
            {mode.featured ? 'Unfeature' : 'Feature'}
          </button>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => void handleToggleActive(mode)}
            disabled={isMutatingModeId === mode.id}
          >
            {mode.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Game Modes"
        title="Catalog"
        description="Create, feature, and activate admin-managed gameplay modes that flow through the player-facing selector."
        meta={
          <div className="meta-strip">
            <MetaStripItem label="Featured" value={catalog?.featuredModeId ?? 'None'} hint="Exactly one featured mode is kept in storage when the catalog is populated." />
            <MetaStripItem label="Saved modes" value={catalog?.modes.length ?? 0} hint="Built-in modes stay outside this catalog." />
          </div>
        }
        actions={
          <Link className="button button--primary" to={appRoutes.gameModes.new}>
            Create mode
          </Link>
        }
      />

      {errorMessage ? <div className="alert alert--error">{errorMessage}</div> : null}

      <SectionPanel
        title="Saved modes"
        subtitle={isLoading ? 'Loading the catalog.' : 'Feature one mode and keep the rest active or inactive as needed.'}
      >
        <DataTable
          columns={columns}
          rows={catalog?.modes ?? []}
          rowKey={(mode) => mode.id}
          emptyState={
            <EmptyState
              title="No saved modes"
              description="Create the first admin-managed mode to populate the catalog."
              compact
            />
          }
          rowClassName={(mode) =>
            mode.featured ? 'table-row table-row--featured' : mode.isActive ? 'table-row' : 'table-row table-row--muted'
          }
        />
      </SectionPanel>

      <SectionPanel
        title={isCreating ? 'Create mode' : `Edit ${editingMode?.name ?? 'mode'}`}
        subtitle={
          isCreating
            ? 'Define a new admin-managed gameplay variant.'
            : 'Change the stored configuration and keep the featured state in sync from the table actions.'
        }
      >
        <form className="stack" onSubmit={(event) => void handleSave(event)}>
          <div className="form-grid">
            <label className="field">
              <span className="field__label">Mode ID</span>
              <input
                value={form.id}
                onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))}
                disabled={!isCreating}
                placeholder="spring_sprint"
              />
              <span className="field__hint">Lowercase letters, numbers, dashes, and underscores only.</span>
            </label>

            <label className="field">
              <span className="field__label">Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Spring Sprint"
              />
            </label>

            <label className="field field--full">
              <span className="field__label">Description</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Short player-facing explanation of the mode."
              />
            </label>

            <label className="field">
              <span className="field__label">Base ruleset preset</span>
              <select
                value={form.baseRulesetPreset}
                onChange={(event) => {
                  const preset = event.target.value as GameModeBaseRulesetPreset
                  const defaults = getGameModePresetDefaults(preset)
                  setForm((current) => ({
                    ...current,
                    baseRulesetPreset: preset,
                    pieceCountPerSide: defaults.pieceCountPerSide,
                    rulesVariant: defaults.rulesVariant,
                    rosetteSafetyMode: defaults.rosetteSafetyMode,
                    exitStyle: defaults.exitStyle,
                    eliminationMode: defaults.eliminationMode,
                    fogOfWar: defaults.fogOfWar,
                    boardAssetKey: defaults.boardAssetKey,
                  }))
                }}
              >
                {GAME_MODE_PRESET_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Piece count</span>
              <input
                type="number"
                min={1}
                step={1}
                value={form.pieceCountPerSide}
                onChange={(event) =>
                  setForm((current) => ({ ...current, pieceCountPerSide: Number(event.target.value) }))
                }
              />
            </label>

            <label className="field">
              <span className="field__label">Rules variant</span>
              <select
                value={form.rulesVariant}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    rulesVariant: event.target.value as GameModeDefinition['rulesVariant'],
                  }))
                }
              >
                {RULE_VARIANT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Rosette safety</span>
              <select
                value={form.rosetteSafetyMode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    rosetteSafetyMode: event.target.value as GameModeRosetteSafetyMode,
                  }))
                }
              >
                {ROSETTE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Exit style</span>
              <select
                value={form.exitStyle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    exitStyle: event.target.value as GameModeExitStyle,
                  }))
                }
              >
                {EXIT_STYLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Elimination mode</span>
              <select
                value={form.eliminationMode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    eliminationMode: event.target.value as GameModeEliminationMode,
                  }))
                }
              >
                {ELIMINATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Board asset</span>
              <select
                value={form.boardAssetKey}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    boardAssetKey: event.target.value as GameModeBoardAssetKey,
                  }))
                }
              >
                {BOARD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="field__hint">Bundled boards are resolved from assets/board/ at match render time.</span>
            </label>

            <label className="field field--inline">
              <input
                type="checkbox"
                checked={form.fogOfWar}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fogOfWar: event.target.checked,
                  }))
                }
              />
              <span className="field__label">Enable fog of war</span>
            </label>

            <label className="field field--inline">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              <span className="field__label">Active</span>
            </label>
          </div>

          <MetaStrip>
            <MetaStripItem label="Preset" value={presetLabel} />
            <MetaStripItem label="Pieces" value={form.pieceCountPerSide} />
            <MetaStripItem label="Rules" value={rulesLabel} />
            <MetaStripItem label="Rosettes" value={form.rosetteSafetyMode === 'open' ? 'Open' : 'Protected'} />
            <MetaStripItem label="Exit" value={form.exitStyle === 'single_exit' ? 'Single exit' : 'Standard'} />
            <MetaStripItem label="Elimination" value={form.eliminationMode === 'eliminated' ? 'Eliminated' : 'Return to start'} />
            <MetaStripItem label="Board" value={boardLabel} />
            <MetaStripItem label="Fog" value={formatBooleanLabel(form.fogOfWar)} />
          </MetaStrip>

          <SectionPanel
            title="Summary preview"
            subtitle={summary}
            className="panel--nested"
          >
            <div className="stack stack--compact">
              <strong>{previewMode.name}</strong>
              <span className="muted">{previewMode.description}</span>
              <span className="mono">{summary}</span>
            </div>
          </SectionPanel>

          <div className="form-submit-panel">
            <div className="form-submit-panel__copy">
              <p className="panel__eyebrow">{isCreating ? 'Create flow' : 'Edit flow'}</p>
              <h3 className="panel__title">{isCreating ? 'Save new gameplay mode' : 'Update gameplay mode'}</h3>
              <p className="panel__subtitle">
                The selected base preset is just a label. The explicit stored fields below are what the player app consumes.
              </p>
            </div>
            <button className="button button--primary" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : isCreating ? 'Create mode' : 'Save changes'}
            </button>
          </div>

          {hasAttemptedSave && validationErrors.length > 0 ? (
            <div className="alert alert--warning">
              <strong>Validation issues</strong>
              <ul>
                {validationErrors.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </form>
      </SectionPanel>
    </>
  )
}
