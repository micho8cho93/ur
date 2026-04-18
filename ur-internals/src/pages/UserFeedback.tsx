import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { listFeedbackSubmissions } from '../api/feedback'
import { EmptyState } from '../components/EmptyState'
import { MetaStrip, MetaStripItem } from '../components/MetaStrip'
import { PageHeader } from '../components/PageHeader'
import { SectionPanel } from '../components/SectionPanel'
import { appRoutes } from '../routes'
import { FEEDBACK_SOURCE_PAGE_LABELS, FEEDBACK_TYPE_LABELS, type FeedbackSubmission } from '../../../shared/feedback'

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatTimeAgo(value: string) {
  const diffMinutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))

  if (diffMinutes < 1) {
    return 'Just now'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  return `${Math.round(diffHours / 24)}d ago`
}

function buildPreview(message: string) {
  const trimmed = message.trim()
  if (trimmed.length <= 96) {
    return trimmed
  }

  return `${trimmed.slice(0, 96).trimEnd()}…`
}

function buildSubmissionSummary(submission: FeedbackSubmission) {
  const parts = [
    `${FEEDBACK_SOURCE_PAGE_LABELS[submission.sourcePage]}`,
    `${FEEDBACK_TYPE_LABELS[submission.type]}`,
    submission.reportedUser ? `Reported ${submission.reportedUser.username}` : null,
  ].filter(Boolean)

  return parts.join(' · ')
}

export function UserFeedbackPage() {
  const { feedbackId } = useParams<{ feedbackId?: string }>()
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadFeedback() {
      setIsLoading(true)
      setError(null)

      try {
        const nextSubmissions = await listFeedbackSubmissions(80)

        if (!active) {
          return
        }

        setSubmissions(nextSubmissions)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : 'Unable to load feedback inbox.')
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadFeedback()

    return () => {
      active = false
    }
  }, [])

  const selectedSubmission = useMemo(() => {
    if (submissions.length === 0) {
      return null
    }

    return submissions.find((entry) => entry.id === feedbackId) ?? submissions[0] ?? null
  }, [feedbackId, submissions])

  const playerReportCount = submissions.filter((entry) => entry.type === 'player_report').length
  const sourceCount = new Set(submissions.map((entry) => entry.sourcePage)).size
  const latestSubmission = submissions[0] ?? null

  return (
    <>
      <PageHeader
        eyebrow="User Feedback"
        title="Feedback inbox"
        description="Recent bugs, feature ideas, and player reports pulled from the shared feedback flow."
      />

      {error ? <div className="alert alert--error">{error}</div> : null}

      <MetaStrip>
        <MetaStripItem
          label="Submissions"
          value={isLoading ? '...' : submissions.length}
          hint="Newest items first."
          tone="accent"
        />
        <MetaStripItem
          label="Player reports"
          value={isLoading ? '...' : playerReportCount}
          hint="Reports with optional match context attached."
          tone="warning"
        />
        <MetaStripItem
          label="Sources"
          value={isLoading ? '...' : sourceCount}
          hint="Home, Play Online, and Match entry points."
        />
        <MetaStripItem
          label="Latest"
          value={isLoading ? '...' : latestSubmission ? formatTimeAgo(latestSubmission.createdAt) : 'No feedback'}
          hint={latestSubmission ? formatDateTime(latestSubmission.createdAt) : 'Waiting for the first submission.'}
          tone="success"
        />
      </MetaStrip>

      <section className="split-grid">
        <SectionPanel
          title="Recent submissions"
          subtitle="Click a row to open the detail view."
        >
          {isLoading ? (
            <EmptyState
              title="Loading feedback"
              description="Fetching the newest submissions from Nakama storage."
              compact
              tone="info"
            />
          ) : submissions.length === 0 ? (
            <EmptyState
              title="No feedback yet"
              description="Feedback from Home, Play Online, and Match will show up here once players start using the shared form."
              compact
            />
          ) : (
            <div className="table-wrap table-wrap--edge">
              <table className="table data-table">
                <thead>
                  <tr>
                    <th className="data-table__cell">Submitter</th>
                    <th className="data-table__cell">Page</th>
                    <th className="data-table__cell">Category</th>
                    <th className="data-table__cell">Timestamp</th>
                    <th className="data-table__cell">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => {
                    const selected = submission.id === selectedSubmission?.id

                    return (
                      <tr
                        key={submission.id}
                        className={selected ? 'table__row table__row--selected' : 'table__row'}
                      >
                        <td className="data-table__cell">
                          <div className="stack stack--compact">
                            <Link className="table__link" to={appRoutes.feedback.detail(submission.id)}>
                              {submission.submitter.username}
                            </Link>
                            <span className="muted mono">{submission.submitter.nakamaUserId ?? submission.submitter.userId}</span>
                          </div>
                        </td>
                        <td className="data-table__cell">
                          <div className="stack stack--compact">
                            <strong>{FEEDBACK_SOURCE_PAGE_LABELS[submission.sourcePage]}</strong>
                            <span className="muted">{buildSubmissionSummary(submission)}</span>
                          </div>
                        </td>
                        <td className="data-table__cell">
                          <div className="stack stack--compact">
                            <strong>{FEEDBACK_TYPE_LABELS[submission.type]}</strong>
                            {submission.reportedUser ? (
                              <span className="muted">Reported {submission.reportedUser.username}</span>
                            ) : (
                              <span className="muted">General feedback</span>
                            )}
                          </div>
                        </td>
                        <td className="data-table__cell">
                          <div className="stack stack--compact">
                            <strong>{formatDateTime(submission.createdAt)}</strong>
                            <span className="muted">{formatTimeAgo(submission.createdAt)}</span>
                          </div>
                        </td>
                        <td className="data-table__cell">
                          <div className="stack stack--compact">
                            <span>{buildPreview(submission.message)}</span>
                            <Link className="table__link" to={appRoutes.feedback.detail(submission.id)}>
                              Open detail
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionPanel>

        <SectionPanel
          title="Submission detail"
          subtitle={selectedSubmission ? selectedSubmission.id : 'No submission selected'}
        >
          {selectedSubmission ? (
            <div className="stack">
              <div className="feedback-detail__hero">
                <div className="stack stack--compact">
                  <p className="meta-label">Message</p>
                  <p className="feedback-detail__message">{selectedSubmission.message}</p>
                </div>
              </div>

              <dl className="feedback-detail__list">
                <div className="feedback-detail__row">
                  <dt>Submitter</dt>
                  <dd>
                    {selectedSubmission.submitter.username}
                    <span className="muted mono">
                      {selectedSubmission.submitter.nakamaUserId
                        ? ` · ${selectedSubmission.submitter.nakamaUserId}`
                        : ` · ${selectedSubmission.submitter.userId}`}
                    </span>
                  </dd>
                </div>
                <div className="feedback-detail__row">
                  <dt>Category</dt>
                  <dd>{FEEDBACK_TYPE_LABELS[selectedSubmission.type]}</dd>
                </div>
                <div className="feedback-detail__row">
                  <dt>Source page</dt>
                  <dd>{FEEDBACK_SOURCE_PAGE_LABELS[selectedSubmission.sourcePage]}</dd>
                </div>
                <div className="feedback-detail__row">
                  <dt>Timestamp</dt>
                  <dd>
                    <div className="stack stack--compact">
                      <strong>{formatDateTime(selectedSubmission.createdAt)}</strong>
                      <span className="muted">{formatTimeAgo(selectedSubmission.createdAt)}</span>
                    </div>
                  </dd>
                </div>
                <div className="feedback-detail__row">
                  <dt>Match context</dt>
                  <dd>{selectedSubmission.matchContext ? selectedSubmission.matchContext.matchId : 'Not provided'}</dd>
                </div>
                <div className="feedback-detail__row">
                  <dt>Reported user</dt>
                  <dd>{selectedSubmission.reportedUser ? selectedSubmission.reportedUser.username : 'Not provided'}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <EmptyState
              title="Select a submission"
              description="The detail view fills with the full message and optional match/report context when you choose a row."
              compact
            />
          )}
        </SectionPanel>
      </section>
    </>
  )
}

