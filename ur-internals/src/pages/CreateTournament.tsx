import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createTournament } from '../api/tournaments'
import { PageHeader } from '../components/PageHeader'
import {
  getTournamentStructureDescription,
  TOURNAMENT_STRUCTURE_OPTIONS,
} from '../tournamentStructure'
import {
  formatSingleEliminationRoundLabel,
  getSingleEliminationRoundCount,
  TOURNAMENT_SIZE_OPTIONS,
} from '../tournamentSizing'

type FormState = {
  runId: string
  name: string
  gameMode: string
  entrants: string
  startAt: string
  joinRequired: boolean
  enableRanks: boolean
  xpPerMatchWin: string
  xpForTournamentChampion: string
  description: string
}

const initialState: FormState = {
  runId: '',
  name: '',
  gameMode: 'standard',
  entrants: '16',
  startAt: '',
  joinRequired: true,
  enableRanks: true,
  xpPerMatchWin: '100',
  xpForTournamentChampion: '250',
  description: '',
}

export function CreateTournamentPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(initialState)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateField(
    field: keyof FormState,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const target = event.target
    const nextValue =
      target instanceof HTMLInputElement && target.type === 'checkbox'
        ? target.checked
        : target.value

    setForm((current) => ({
      ...current,
      [field]: nextValue,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const entrants = Number(form.entrants)
    const xpPerMatchWin = Number(form.xpPerMatchWin)
    const xpForTournamentChampion = Number(form.xpForTournamentChampion)
    const roundCount = getSingleEliminationRoundCount(entrants)

    if (!form.name.trim()) {
      setError('Tournament name is required.')
      return
    }

    if (!form.startAt) {
      setError('Start date and time are required.')
      return
    }

    if (!Number.isFinite(entrants) || entrants < 2) {
      setError('Entrant cap must be at least 2.')
      return
    }

    if (roundCount < 1) {
      setError('Entrant cap must be a supported power-of-two bracket size.')
      return
    }

    if (!Number.isFinite(xpPerMatchWin) || xpPerMatchWin < 0) {
      setError('Tournament match win XP must be 0 or greater.')
      return
    }

    if (!Number.isFinite(xpForTournamentChampion) || xpForTournamentChampion < 0) {
      setError('Tournament champion XP must be 0 or greater.')
      return
    }

    try {
      setIsSaving(true)

      const tournament = await createTournament({
        runId: form.runId.trim() || undefined,
        name: form.name.trim(),
        description: form.description.trim(),
        gameMode: form.gameMode,
        entrants,
        startAt: new Date(form.startAt).toISOString(),
        joinRequired: form.joinRequired,
        enableRanks: form.enableRanks,
        xpPerMatchWin: Math.floor(xpPerMatchWin),
        xpForTournamentChampion: Math.floor(xpForTournamentChampion),
      })

      void navigate(`/tournaments/${tournament.id}`)
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Unable to create tournament.'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="CreateTournament"
        title="Create a tournament run"
        description="Creates a draft single-elimination tournament run in Nakama. Drafts stay hidden from public players until you open them from the admin dashboard."
        actions={
          <Link to="/tournaments" className="button">
            Cancel
          </Link>
        }
      />

      {error ? <div className="alert alert--error">{error}</div> : null}

      <section className="panel">
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="runId">Run id</label>
              <input
                id="runId"
                name="runId"
                value={form.runId}
                onChange={(event) => updateField('runId', event)}
                placeholder="spring-crown-2026"
              />
            </div>

            <div className="field">
              <label htmlFor="name">Tournament name</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={(event) => updateField('name', event)}
                placeholder="Spring Crown 2026"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="gameMode">Game structure</label>
              <select
                id="gameMode"
                name="gameMode"
                value={form.gameMode}
                onChange={(event) => updateField('gameMode', event)}
              >
                {TOURNAMENT_STRUCTURE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="muted">{getTournamentStructureDescription(form.gameMode)}</span>
            </div>

            <div className="field">
              <label htmlFor="startAt">Start date</label>
              <input
                id="startAt"
                name="startAt"
                type="datetime-local"
                value={form.startAt}
                onChange={(event) => updateField('startAt', event)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="entrants">Entrant cap</label>
              <select
                id="entrants"
                name="entrants"
                value={form.entrants}
                onChange={(event) => updateField('entrants', event)}
                required
              >
                {TOURNAMENT_SIZE_OPTIONS.map((size) => {
                  const roundCount = getSingleEliminationRoundCount(size)
                  return (
                    <option key={size} value={size}>
                      {size} players • {formatSingleEliminationRoundLabel(roundCount)}
                    </option>
                  )
                })}
              </select>
              <span className="muted">
                Single-elimination only. The bracket will use{' '}
                {formatSingleEliminationRoundLabel(
                  getSingleEliminationRoundCount(Number(form.entrants)),
                )}{' '}
                and finalize automatically when a winner is decided.
              </span>
            </div>

            <div className="field">
              <label htmlFor="xpPerMatchWin">XP per tournament game win</label>
              <input
                id="xpPerMatchWin"
                name="xpPerMatchWin"
                type="number"
                min="0"
                value={form.xpPerMatchWin}
                onChange={(event) => updateField('xpPerMatchWin', event)}
                required
              />
              <span className="muted">Set to 0 if this tournament should not award XP for individual match wins.</span>
            </div>

            <div className="field">
              <label htmlFor="xpForTournamentChampion">XP for winning the tournament</label>
              <input
                id="xpForTournamentChampion"
                name="xpForTournamentChampion"
                type="number"
                min="0"
                value={form.xpForTournamentChampion}
                onChange={(event) => updateField('xpForTournamentChampion', event)}
                required
              />
              <span className="muted">
                This champion bonus is awarded once when the run is finalized. Public elimination runs finalize automatically after the deciding match.
              </span>
            </div>

            <div className="field field--full field--checkboxes">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.joinRequired}
                  onChange={(event) => updateField('joinRequired', event)}
                />
                <span>Require tournament join before counted matches are recorded</span>
              </label>

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.enableRanks}
                  onChange={(event) => updateField('enableRanks', event)}
                />
                <span>Enable rank tracking</span>
              </label>
            </div>

            <div className="field field--full">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={(event) => updateField('description', event)}
                placeholder="Describe the format, operator expectations, and prize plan."
              />
            </div>
          </div>

          <div className="form__actions">
            <button className="button button--primary" type="submit" disabled={isSaving}>
              {isSaving ? 'Creating...' : 'Create tournament'}
            </button>
            <span className="muted">
              After creation, open the run from internals to make it visible on `urgame.live`.
            </span>
          </div>
        </form>
      </section>
    </>
  )
}
