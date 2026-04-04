import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createTournament } from '../api/tournaments'
import { ActionToolbar } from '../components/ActionToolbar'
import { MetaStrip, MetaStripItem } from '../components/MetaStrip'
import { PageHeader } from '../components/PageHeader'
import { SectionPanel } from '../components/SectionPanel'
import { appRoutes } from '../routes'
import {
  getTournamentStructureDescription,
  getTournamentStructureLabel,
  TOURNAMENT_STRUCTURE_OPTIONS,
} from '../tournamentStructure'
import {
  formatSingleEliminationRoundLabel,
  getSingleEliminationRoundCount,
  TOURNAMENT_SIZE_OPTIONS,
} from '../tournamentSizing'
import { BOT_DIFFICULTIES, DEFAULT_BOT_DIFFICULTY, type BotDifficulty } from '../types/bot'

type FormState = {
  runId: string
  name: string
  gameMode: string
  entrants: string
  startAt: string
  autoAddBots: boolean
  botDifficulty: BotDifficulty
  joinRequired: boolean
  enableRanks: boolean
  xpPerMatchWin: string
  xpForTournamentChampion: string
  description: string
}

const initialState: FormState = {
  runId: '',
  name: '',
  gameMode: 'gameMode_3_pieces',
  entrants: '16',
  startAt: '',
  autoAddBots: false,
  botDifficulty: DEFAULT_BOT_DIFFICULTY,
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
        autoAddBots: form.autoAddBots,
        botDifficulty: form.autoAddBots ? form.botDifficulty : null,
        joinRequired: form.joinRequired,
        enableRanks: form.enableRanks,
        xpPerMatchWin: Math.floor(xpPerMatchWin),
        xpForTournamentChampion: Math.floor(xpForTournamentChampion),
      })

      void navigate(appRoutes.tournaments.detail(tournament.id))
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Unable to create tournament.'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const entrantCount = Number(form.entrants)
  const roundCount = getSingleEliminationRoundCount(entrantCount)
  const roundLabel =
    roundCount > 0 ? formatSingleEliminationRoundLabel(roundCount) : 'Unsupported bracket size'
  const awardsXp = Number(form.xpPerMatchWin) > 0 || Number(form.xpForTournamentChampion) > 0
  const structureLabel = getTournamentStructureLabel(form.gameMode)
  const botSummary = form.autoAddBots ? `Bot fill enabled · ${form.botDifficulty}` : 'Bots off'

  return (
    <>
      <PageHeader
        eyebrow="Create Tournament"
        title="Create a tournament run"
        description="Creates a draft single-elimination tournament run in Nakama. Drafts stay hidden from public players until you open them from the admin dashboard."
        actions={
          <ActionToolbar>
            <Link to={appRoutes.tournaments.runs} className="button button--secondary">
              Cancel
            </Link>
          </ActionToolbar>
        }
      />

      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="create-layout">
        <form className="form create-form" onSubmit={handleSubmit}>
          <SectionPanel
            title="Identity & schedule"
            subtitle="Define the internal run identifier, player-facing name, and launch window."
          >
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
                <span className="field__hint">Optional stable id for operators and exports.</span>
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
                <span className="field__hint">Primary label shown throughout admin and player surfaces.</span>
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
                <span className="field__hint">Controls when the run is scheduled to begin.</span>
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
                <span className="field__hint">Operator context and player-facing copy for this run.</span>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel
            title="Tournament structure & field"
            subtitle="Configure the bracket format and the maximum field size."
          >
            <div className="form-grid">
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
                <span className="field__hint">{getTournamentStructureDescription(form.gameMode)}</span>
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
                    const optionRoundCount = getSingleEliminationRoundCount(size)
                    return (
                      <option key={size} value={size}>
                        {size} players • {formatSingleEliminationRoundLabel(optionRoundCount)}
                      </option>
                    )
                  })}
                </select>
                <span className="field__hint">
                  Single-elimination only. This field size creates {roundLabel} and finalizes automatically when a winner is decided.
                </span>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel
            title="XP rewards"
            subtitle="Set tournament match and champion reward values."
          >
            <div className="form-grid">
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
                <span className="field__hint">Set to 0 if this run should not award XP for individual match wins.</span>
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
                <span className="field__hint">
                  This champion bonus is awarded once when the run is finalized.
                </span>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel
            title="Join & rank behavior"
            subtitle="Retain the existing tournament participation and ranking controls."
          >
            <div className="form-grid">
              <div className="field field--full field--checkboxes">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.autoAddBots}
                    onChange={(event) => updateField('autoAddBots', event)}
                  />
                  <span>
                    <strong>Fill missing seats with bots at deadline</strong>
                    <small>
                      Keeps the current 3-minute lobby deadline. If seats remain open, bots fill them unless no humans joined.
                    </small>
                  </span>
                </label>
              </div>

              <div className="field">
                <label htmlFor="botDifficulty">Bot difficulty</label>
                <select
                  id="botDifficulty"
                  name="botDifficulty"
                  value={form.botDifficulty}
                  disabled={!form.autoAddBots}
                  onChange={(event) => updateField('botDifficulty', event)}
                >
                  {BOT_DIFFICULTIES.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>
                <span className="field__hint">
                  Bot-enabled runs default to easy and keep this difficulty for all inserted seats.
                </span>
              </div>

              <div className="field field--full field--checkboxes">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.joinRequired}
                  onChange={(event) => updateField('joinRequired', event)}
                />
                <span>
                  <strong>Require join before scoring</strong>
                  <small>Counted matches only record after a player has explicitly joined the tournament.</small>
                </span>
              </label>

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.enableRanks}
                  onChange={(event) => updateField('enableRanks', event)}
                />
                <span>
                  <strong>Enable rank tracking</strong>
                  <small>Keep ranking snapshots and standings visible across the internals workflow.</small>
                </span>
              </label>
              </div>
            </div>
          </SectionPanel>

          <section className="panel form-submit-panel">
            <div className="form-submit-panel__copy">
              <p className="panel__eyebrow">Publish flow</p>
              <h3 className="panel__title">Create draft run</h3>
              <p className="panel__subtitle">
                After creation, open the run from internals to make it visible on `urgame.live`.
              </p>
            </div>

            <ActionToolbar>
              <button className="button button--primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Creating...' : 'Create tournament'}
              </button>
              <Link to={appRoutes.tournaments.runs} className="button button--secondary">
                Return to queue
              </Link>
            </ActionToolbar>
          </section>
        </form>

        <aside className="create-sidebar stack">
          <SectionPanel
            title="Run summary"
            subtitle="Live configuration snapshot derived from the current form state."
          >
            <MetaStrip className="meta-strip--compact">
              <MetaStripItem label="Structure" value={structureLabel} hint={roundLabel} tone="accent" />
              <MetaStripItem label="Field size" value={`${form.entrants} players`} hint="Single-elimination bracket" />
              <MetaStripItem
                label="Visibility"
                value="Draft until opened"
                hint="Players cannot see or join the run before open."
                tone="warning"
              />
              <MetaStripItem
                label="Rewards"
                value={awardsXp ? 'XP enabled' : 'No XP rewards'}
                hint={`${form.xpPerMatchWin} per win / ${form.xpForTournamentChampion} champion`}
              />
              <MetaStripItem label="Bot fill" value={botSummary} hint="Policy applies only if the lobby misses its deadline." />
            </MetaStrip>
          </SectionPanel>

          <SectionPanel
            title="Operator notes"
            subtitle="Behavior preserved from the current tournament implementation."
          >
            <ul className="list list--dense">
              <li className="list__item">
                <strong>Open manually</strong>
                <span className="muted">The run is created in draft state and remains hidden until opened from the tournament queue.</span>
              </li>
              <li className="list__item">
                <strong>Finalize automatically</strong>
                <span className="muted">Runs still finalize after the deciding match, and empty bot-fill lobbies still close instead of becoming bot-only tournaments.</span>
              </li>
              <li className="list__item">
                <strong>Bracket sizing</strong>
                <span className="muted">Supported sizes remain power-of-two brackets only.</span>
              </li>
            </ul>
          </SectionPanel>
        </aside>
      </div>
    </>
  )
}
