export const FEEDBACK_TYPES = ['bug', 'feature_request', 'player_report'] as const
export type FeedbackType = (typeof FEEDBACK_TYPES)[number]

export const FEEDBACK_SOURCE_PAGES = ['home', 'play_online', 'match'] as const
export type FeedbackSourcePage = (typeof FEEDBACK_SOURCE_PAGES)[number]

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  bug: 'Bug',
  feature_request: 'Feature request',
  player_report: 'Player report',
}

export const FEEDBACK_SOURCE_PAGE_LABELS: Record<FeedbackSourcePage, string> = {
  home: 'Home',
  play_online: 'Play Online',
  match: 'Match',
}

export const FEEDBACK_SUBMISSION_COLLECTION = 'user_feedback_submissions'
export const FEEDBACK_DEFAULT_LIST_LIMIT = 50
export const FEEDBACK_MAX_LIST_LIMIT = 100

export type FeedbackSubmitter = {
  userId: string
  username: string
  provider: string
  nakamaUserId: string | null
}

export type FeedbackMatchContext = {
  matchId: string
}

export type FeedbackReportedUser = {
  userId: string
  username: string
}

export type FeedbackSubmission = {
  id: string
  type: FeedbackType
  message: string
  sourcePage: FeedbackSourcePage
  submitter: FeedbackSubmitter
  matchContext: FeedbackMatchContext | null
  reportedUser: FeedbackReportedUser | null
  createdAt: string
}

export type SubmitFeedbackRpcRequest = {
  type: FeedbackType
  message: string
  sourcePage: FeedbackSourcePage
  submitter?: Partial<FeedbackSubmitter> | null
  matchContext?: FeedbackMatchContext | null
  reportedUser?: FeedbackReportedUser | null
}

export type SubmitFeedbackRpcResponse = {
  submission: FeedbackSubmission
}

export type ListFeedbackRpcResponse = {
  submissions: FeedbackSubmission[]
}

