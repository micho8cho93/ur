import env from '../config/env'
import { mockFeedbackSubmissions } from '../data/mockData'
import { callRpc } from './client'
import { asRecord, readArrayField, readStringField } from './runtime'
import type {
  FeedbackMatchContext,
  FeedbackReportedUser,
  FeedbackSourcePage,
  FeedbackSubmitter,
  FeedbackSubmission,
  FeedbackType,
  ListFeedbackRpcResponse,
  SubmitFeedbackRpcRequest,
  SubmitFeedbackRpcResponse,
} from '../../../shared/feedback'

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

function normalizeFeedbackType(value: unknown): FeedbackType | null {
  if (value === 'bug' || value === 'feature_request' || value === 'player_report') {
    return value
  }

  return null
}

function normalizeFeedbackSourcePage(value: unknown): FeedbackSourcePage | null {
  if (value === 'home' || value === 'play_online' || value === 'match') {
    return value
  }

  return null
}

function normalizeMatchContext(value: unknown): FeedbackMatchContext | null {
  const record = asRecord(value)
  const matchId = readStringField(record, ['matchId', 'match_id'])
  return matchId ? { matchId } : null
}

function normalizeReportedUser(value: unknown): FeedbackReportedUser | null {
  const record = asRecord(value)
  const userId = readStringField(record, ['userId', 'user_id'])
  const username = readStringField(record, ['username', 'displayName', 'display_name', 'name'])

  if (!userId || !username) {
    return null
  }

  return { userId, username }
}

function normalizeSubmitter(value: unknown): FeedbackSubmitter | null {
  const record = asRecord(value)
  const userId = readStringField(record, ['userId', 'user_id'])
  const username = readStringField(record, ['username', 'displayName', 'display_name', 'name'])
  const provider = readStringField(record, ['provider'])
  const nakamaUserId = readStringField(record, ['nakamaUserId', 'nakama_user_id'])

  if (!userId || !username) {
    return null
  }

  return {
    userId,
    username,
    provider: provider ?? 'unknown',
    nakamaUserId,
  }
}

function normalizeFeedbackSubmission(value: unknown): FeedbackSubmission | null {
  const record = asRecord(value)
  const id = readStringField(record, ['id', 'submissionId', 'submission_id'])
  const type = normalizeFeedbackType(readStringField(record, ['type']))
  const message = readStringField(record, ['message', 'body'])
  const sourcePage = normalizeFeedbackSourcePage(readStringField(record, ['sourcePage', 'source_page']))
  const submitter = normalizeSubmitter(record?.submitter)
  const createdAt = readStringField(record, ['createdAt', 'created_at'])

  if (!id || !type || !message || !sourcePage || !submitter || !createdAt) {
    return null
  }

  return {
    id,
    type,
    message,
    sourcePage,
    submitter,
    matchContext: normalizeMatchContext(record?.matchContext ?? record?.match_context),
    reportedUser: normalizeReportedUser(record?.reportedUser ?? record?.reported_user),
    createdAt,
  }
}

export async function submitFeedback(request: SubmitFeedbackRpcRequest): Promise<FeedbackSubmission> {
  const response = await callRpc<SubmitFeedbackRpcResponse>('submit_feedback', request)
  const submission = normalizeFeedbackSubmission(response.submission)

  if (!submission) {
    throw new Error('Feedback submission returned an invalid payload.')
  }

  return submission
}

export async function listFeedbackSubmissions(limit = 50): Promise<FeedbackSubmission[]> {
  if (env.useMockData) {
    await wait(140)
    return [...mockFeedbackSubmissions]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit)
  }

  const response = await callRpc<ListFeedbackRpcResponse>('admin_list_feedback', { limit })
  return readArrayField(response, ['submissions'])
    .map((submission) => normalizeFeedbackSubmission(submission))
    .filter((submission): submission is FeedbackSubmission => Boolean(submission))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}
