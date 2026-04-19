import { nakamaService } from './nakama'
import type {
  ListFeedbackRpcResponse,
  SubmitFeedbackRpcRequest,
  SubmitFeedbackRpcResponse,
} from '../shared/feedback'

const RPC_SUBMIT_FEEDBACK = 'submit_feedback'
const RPC_ADMIN_LIST_FEEDBACK = 'admin_list_feedback'

const normalizeRpcPayload = (payload: unknown): unknown => {
  if (typeof payload !== 'string') {
    return payload
  }

  try {
    return JSON.parse(payload)
  } catch {
    return payload
  }
}

async function getRpcSession() {
  const session = await nakamaService.loadSession()

  if (!session) {
    throw new Error('No active Nakama session. Authenticate before requesting feedback data.')
  }

  return session
}

async function callFeedbackRpc<T>(endpoint: string, payload: Record<string, unknown> = {}): Promise<T> {
  const session = await getRpcSession()
  const response = await nakamaService.getClient().rpc(session, endpoint, payload)
  return normalizeRpcPayload(response.payload) as T
}

export async function submitFeedback(request: SubmitFeedbackRpcRequest): Promise<SubmitFeedbackRpcResponse['submission']> {
  const response = await callFeedbackRpc<SubmitFeedbackRpcResponse>(RPC_SUBMIT_FEEDBACK, request)
  return response.submission
}

export async function listFeedback(limit = 50): Promise<ListFeedbackRpcResponse['submissions']> {
  const response = await callFeedbackRpc<ListFeedbackRpcResponse>(RPC_ADMIN_LIST_FEEDBACK, { limit })
  return response.submissions
}
