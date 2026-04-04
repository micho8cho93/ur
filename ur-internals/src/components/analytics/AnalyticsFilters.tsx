import { useEffect, useState } from 'react'
import { createDefaultAnalyticsFilters, trimGameModeLabel } from '../../analytics/utils'
import type { AnalyticsQueryFilters, AnalyticsTournamentFilterOption } from '../../types/analytics'

interface AnalyticsFiltersProps {
  filters: AnalyticsQueryFilters
  tournamentOptions: AnalyticsTournamentFilterOption[]
  gameModeOptions: string[]
  isLoading: boolean
  onApply: (filters: AnalyticsQueryFilters) => void
}

export function AnalyticsFilters({
  filters,
  tournamentOptions,
  gameModeOptions,
  isLoading,
  onApply,
}: AnalyticsFiltersProps) {
  const [draft, setDraft] = useState(filters)

  useEffect(() => {
    setDraft(filters)
  }, [filters])

  function setPreset(days: number) {
    const end = new Date()
    const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
    setDraft((current) => ({
      ...current,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    }))
  }

  function resetFilters() {
    const defaults = createDefaultAnalyticsFilters()
    setDraft(defaults)
    onApply(defaults)
  }

  return (
    <section className="analytics-filters">
      <div className="analytics-filters__header">
        <div>
          <p className="meta-label">Global filters</p>
          <strong>Owner-focused, real-data only</strong>
          <span>Filters apply across summary, behavior, tournaments, and realtime views.</span>
        </div>

        <div className="analytics-filter-presets" aria-label="Date range presets">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              className="button button--secondary"
              type="button"
              onClick={() => {
                setPreset(days)
              }}
              disabled={isLoading}
            >
              Last {days}d
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-filters__grid">
        <label className="field">
          <span className="field__label">Start date</span>
          <input
            type="date"
            value={draft.startDate}
            onChange={(event) => {
              const value = event.target.value
              setDraft((current) => ({
                ...current,
                startDate: value,
              }))
            }}
          />
        </label>

        <label className="field">
          <span className="field__label">End date</span>
          <input
            type="date"
            value={draft.endDate}
            onChange={(event) => {
              const value = event.target.value
              setDraft((current) => ({
                ...current,
                endDate: value,
              }))
            }}
          />
        </label>

        <label className="field">
          <span className="field__label">Tournament</span>
          <select
            value={draft.tournamentId ?? ''}
            onChange={(event) => {
              const value = event.target.value
              setDraft((current) => ({
                ...current,
                tournamentId: value || null,
              }))
            }}
          >
            <option value="">All tournaments</option>
            {tournamentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Game mode</span>
          <select
            value={draft.gameMode ?? ''}
            onChange={(event) => {
              const value = event.target.value
              setDraft((current) => ({
                ...current,
                gameMode: value || null,
              }))
            }}
          >
            <option value="">All modes</option>
            {gameModeOptions.map((modeId) => (
              <option key={modeId} value={modeId}>
                {trimGameModeLabel(modeId)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Elo min</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Any"
            value={draft.eloMin ?? ''}
            onChange={(event) => {
              const value = event.target.value
              setDraft((current) => ({
                ...current,
                eloMin: value.length > 0 ? Number(value) : null,
              }))
            }}
          />
        </label>

        <label className="field">
          <span className="field__label">Elo max</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Any"
            value={draft.eloMax ?? ''}
            onChange={(event) => {
              const value = event.target.value
              setDraft((current) => ({
                ...current,
                eloMax: value.length > 0 ? Number(value) : null,
              }))
            }}
          />
        </label>
      </div>

      <div className="analytics-filters__footer">
        <span className="analytics-filters__note">
          Missing filter options simply mean no live values are available yet. Analytics never falls back to seeded data.
        </span>

        <div className="action-toolbar">
          <button
            className="button button--secondary"
            type="button"
            onClick={resetFilters}
            disabled={isLoading}
          >
            Reset
          </button>
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              onApply(draft)
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Apply filters'}
          </button>
        </div>
      </div>
    </section>
  )
}
