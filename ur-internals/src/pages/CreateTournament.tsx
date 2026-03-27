import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createTournament } from '../api/tournaments'
import { PageHeader } from '../components/PageHeader'
import {
  getTournamentStructureDescription,
  TOURNAMENT_STRUCTURE_OPTIONS,
} from '../tournamentStructure'

type FormState = {
  runId: string
  name: string
  gameMode: string
  entrants: string
  startAt: string
  durationMinutes: string
  maxNumScore: string
  joinRequired: boolean
  enableRanks: boolean
  description: string
}

const initialState: FormState = {
  runId: '',
  name: '',
  gameMode: 'standard',
  entrants: '32',
  startAt: '',
  durationMinutes: '120',
  maxNumScore: '7',
  joinRequired: true,
  enableRanks: true,
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
    const durationMinutes = Number(form.durationMinutes)
    const maxNumScore = Number(form.maxNumScore)

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

    if (!Number.isFinite(durationMinutes) || durationMinutes < 5) {
      setError('Duration must be at least 5 minutes.')
      return
    }

    if (!Number.isFinite(maxNumScore) || maxNumScore < 1) {
      setError('Counted matches per player must be at least 1.')
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
        durationMinutes,
        maxNumScore,
        joinRequired: form.joinRequired,
        enableRanks: form.enableRanks,
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
        description="Creates a draft tournament run in Nakama. Drafts stay hidden from public players until you open them from the admin dashboard."
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
              <input
                id="entrants"
                name="entrants"
                type="number"
                min="2"
                value={form.entrants}
                onChange={(event) => updateField('entrants', event)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="durationMinutes">Duration (minutes)</label>
              <input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min="5"
                value={form.durationMinutes}
                onChange={(event) => updateField('durationMinutes', event)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="maxNumScore">Counted matches per player</label>
              <input
                id="maxNumScore"
                name="maxNumScore"
                type="number"
                min="1"
                value={form.maxNumScore}
                onChange={(event) => updateField('maxNumScore', event)}
                required
              />
              <span className="muted">
                One counted tournament result is written for each completed tournament match by a player.
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
