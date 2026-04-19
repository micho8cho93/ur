import { useEffect, useMemo, useState } from 'react'
import {
  clearManualRotation,
  getAdminFullCatalog,
  getRotationState,
  removeLimitedTimeEvent,
  setLimitedTimeEvent,
  setManualRotation,
} from '../api/store'
import { ActionToolbar } from '../components/ActionToolbar'
import { useTopbarActions } from '../layout/TopbarActionsContext'
import { DataTable, type DataTableColumn } from '../components/DataTable'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { SectionPanel } from '../components/SectionPanel'
import type { CosmeticDefinition, LimitedTimeEvent, StoreRotationStateResponse } from '../types/store'

const emptyEvent: LimitedTimeEvent = {
  id: '',
  name: '',
  cosmeticIds: [],
  startsAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
}

function readSelected(select: HTMLSelectElement): string[] {
  return Array.from(select.selectedOptions).map((option) => option.value)
}

export function StoreRotationPage() {
  const [catalog, setCatalog] = useState<CosmeticDefinition[]>([])
  const [rotation, setRotation] = useState<StoreRotationStateResponse | null>(null)
  const [dailySelection, setDailySelection] = useState<string[]>([])
  const [featuredSelection, setFeaturedSelection] = useState<string[]>([])
  const [eventForm, setEventForm] = useState<LimitedTimeEvent>(emptyEvent)
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeCatalog = useMemo(() => catalog.filter((item) => !item.disabled), [catalog])
  const nameById = useMemo(() => new Map(catalog.map((item) => [item.id, item.name])), [catalog])
  const dailyOptions = useMemo(
    () => activeCatalog.filter((item) => item.tier === 'common' || item.tier === 'rare'),
    [activeCatalog],
  )
  const featuredOptions = useMemo(
    () => activeCatalog.filter((item) => item.tier === 'epic' || item.tier === 'legendary'),
    [activeCatalog],
  )

  const eventColumns: DataTableColumn<LimitedTimeEvent>[] = [
    {
      key: 'event',
      header: 'Event',
      render: (event) => (
        <div className="stack stack--compact">
          <strong>{event.name}</strong>
          <span className="muted mono">{event.id}</span>
        </div>
      ),
    },
    {
      key: 'window',
      header: 'Window',
      render: (event) => (
        <div className="stack stack--compact">
          <span>{event.startsAt}</span>
          <span className="muted">{event.endsAt}</span>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (event) => event.cosmeticIds.map((id) => nameById.get(id) ?? id).join(', '),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (event) => (
        <button
          className="button button--danger"
          type="button"
          onClick={() => {
            void handleRemoveEvent(event)
          }}
        >
          Remove
        </button>
      ),
    },
  ]

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const [rotationResponse, catalogResponse] = await Promise.all([getRotationState(), getAdminFullCatalog()])
      setRotation(rotationResponse)
      setCatalog(catalogResponse.items)
      setDailySelection(rotationResponse.dailyRotationIds)
      setFeaturedSelection(rotationResponse.featuredIds)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load rotation control.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSetManual() {
    if (dailySelection.length < 6 || dailySelection.length > 8) {
      setError('Daily rotation must contain 6 to 8 items.')
      return
    }
    if (featuredSelection.length > 0 && (featuredSelection.length < 1 || featuredSelection.length > 2)) {
      setError('Featured rotation must contain 1 to 2 items when set.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const response = await setManualRotation(dailySelection, featuredSelection)
      setRotation(response)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to set manual rotation.')
    } finally {
      setSaving(false)
    }
  }

  async function handleClearManual() {
    setSaving(true)
    setError(null)
    try {
      const response = await clearManualRotation()
      setRotation(response)
      setDailySelection(response.dailyRotationIds)
      setFeaturedSelection(response.featuredIds)
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : 'Unable to clear manual rotation.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSetEvent() {
    if (!eventForm.id.trim() || !eventForm.name.trim()) {
      setError('Limited-time events need an ID and name.')
      return
    }
    if (eventForm.cosmeticIds.length === 0) {
      setError('Choose at least one cosmetic for the event.')
      return
    }
    if (Date.parse(eventForm.startsAt) >= Date.parse(eventForm.endsAt)) {
      setError('Event end must be after the start.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const response = await setLimitedTimeEvent(eventForm)
      setRotation(response)
      setEventForm(emptyEvent)
    } catch (eventError) {
      setError(eventError instanceof Error ? eventError.message : 'Unable to save limited-time event.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveEvent(event: LimitedTimeEvent) {
    if (typeof window !== 'undefined' && !window.confirm(`Remove "${event.name}"?`)) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      setRotation(await removeLimitedTimeEvent(event.id))
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Unable to remove limited-time event.')
    } finally {
      setSaving(false)
    }
  }

  useTopbarActions(
    <button className="button button--secondary" type="button" onClick={() => void load()}>
      Refresh
    </button>,
  )

  return (
    <>
      <PageHeader
        eyebrow="Store"
        title="Rotation"
        description="Set manual daily and featured store rotation IDs, or manage limited-time cosmetic events."
      />

      {error ? <div className="alert alert--error">{error}</div> : null}

      <SectionPanel
        title="Manual rotation"
        subtitle={
          isLoading
            ? 'Loading rotation state.'
            : rotation?.manualOverride
              ? `Manual override generated ${rotation.generatedAt}`
              : `Automatic rotation generated ${rotation?.generatedAt ?? 'unknown'}`
        }
      >
        <div className="form-grid">
          <label className="field">
            <span className="field__label">Daily items</span>
            <select multiple size={10} value={dailySelection} onChange={(event) => setDailySelection(readSelected(event.target))}>
              <optgroup label="Common and rare">
                {dailyOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.tier})
                  </option>
                ))}
              </optgroup>
            </select>
            <span className="field__hint">{dailySelection.length}/8 selected.</span>
          </label>
          <label className="field">
            <span className="field__label">Featured items</span>
            <select
              multiple
              size={10}
              value={featuredSelection}
              onChange={(event) => setFeaturedSelection(readSelected(event.target))}
            >
              <optgroup label="Epic and legendary">
                {featuredOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.tier})
                  </option>
                ))}
              </optgroup>
            </select>
            <span className="field__hint">{featuredSelection.length}/2 selected.</span>
          </label>
        </div>
        <ActionToolbar>
          <button className="button button--primary" type="button" disabled={saving} onClick={() => void handleSetManual()}>
            Set manual rotation
          </button>
          <button className="button button--secondary" type="button" disabled={saving} onClick={() => void handleClearManual()}>
            Clear manual rotation
          </button>
        </ActionToolbar>
      </SectionPanel>

      <SectionPanel title="Limited-time event" subtitle="Active event items appear in the player storefront while the window is open.">
        <div className="form-grid">
          <label className="field">
            <span className="field__label">Event ID</span>
            <input value={eventForm.id} onChange={(event) => setEventForm((current) => ({ ...current, id: event.target.value }))} />
          </label>
          <label className="field">
            <span className="field__label">Name</span>
            <input value={eventForm.name} onChange={(event) => setEventForm((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label className="field">
            <span className="field__label">Starts at</span>
            <input value={eventForm.startsAt} onChange={(event) => setEventForm((current) => ({ ...current, startsAt: event.target.value }))} />
          </label>
          <label className="field">
            <span className="field__label">Ends at</span>
            <input value={eventForm.endsAt} onChange={(event) => setEventForm((current) => ({ ...current, endsAt: event.target.value }))} />
          </label>
          <label className="field field--full">
            <span className="field__label">Cosmetics</span>
            <select
              multiple
              size={8}
              value={eventForm.cosmeticIds}
              onChange={(event) => setEventForm((current) => ({ ...current, cosmeticIds: readSelected(event.target) }))}
            >
              {activeCatalog.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.type})
                </option>
              ))}
            </select>
          </label>
        </div>
        <ActionToolbar>
          <button className="button button--primary" type="button" disabled={saving} onClick={() => void handleSetEvent()}>
            Save event
          </button>
        </ActionToolbar>
      </SectionPanel>

      <SectionPanel title="Current events" subtitle={`${rotation?.limitedTimeEvents.length ?? 0} configured events.`}>
        <DataTable
          columns={eventColumns}
          rows={rotation?.limitedTimeEvents ?? []}
          rowKey={(event) => event.id}
          emptyState={<EmptyState title="No limited-time events" description="Create an event to feature specific cosmetics." />}
        />
      </SectionPanel>
    </>
  )
}
