import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createTournament } from '../api/tournaments'
import { PageHeader } from '../components/PageHeader'

type FormState = {
  runId: string
  name: string
  gameMode: string
  entrants: string
  startAt: string
  durationMinutes: string
  buyIn: string
  region: string
  maxNumScore: string
  joinRequired: boolean
  enableRanks: boolean
  description: string
}

const initialState: FormState = {
  runId: '',
  name: '',
  gameMode: 'Classic ladder',
  entrants: '32',
  startAt: '',
  durationMinutes: '120',
  buyIn: 'Free',
  region: 'Global',
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
      setError('Max score writes must be at least 1.')
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
        buyIn: form.buyIn,
        region: form.region,
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
        description="Submits directly to the Nakama admin create-run RPC and stores metadata for game mode, region, and buy-in."
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
              <label htmlFor="gameMode">Game mode</label>
              <select
                id="gameMode"
                name="gameMode"
                value={form.gameMode}
                onChange={(event) => updateField('gameMode', event)}
              >
                <option>Classic ladder</option>
                <option>Swiss</option>
                <option>Double elimination</option>
                <option>Teams</option>
              </select>
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
              <label htmlFor="buyIn">Buy-in</label>
              <input
                id="buyIn"
                name="buyIn"
                value={form.buyIn}
                onChange={(event) => updateField('buyIn', event)}
                placeholder="Free"
              />
            </div>

            <div className="field">
              <label htmlFor="region">Region</label>
              <input
                id="region"
                name="region"
                value={form.region}
                onChange={(event) => updateField('region', event)}
                placeholder="Global"
              />
            </div>

            <div className="field">
              <label htmlFor="maxNumScore">Max score writes</label>
              <input
                id="maxNumScore"
                name="maxNumScore"
                type="number"
                min="1"
                value={form.maxNumScore}
                onChange={(event) => updateField('maxNumScore', event)}
                required
              />
            </div>

            <div className="field field--full field--checkboxes">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.joinRequired}
                  onChange={(event) => updateField('joinRequired', event)}
                />
                <span>Require tournament join before score writes</span>
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
              Runs are created in draft mode and use incremental scoring for match-based standings.
            </span>
          </div>
        </form>
      </section>
    </>
  )
}
