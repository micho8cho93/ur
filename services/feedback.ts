import { callRpc } from './nakama'
import type {
  ListFeedbackRpcResponse,
  SubmitFeedbackRpcRequest,
  SubmitFeedbackRpcResponse,
} from '../shared/feedback'

const RPC_SUBMIT_FEEDBACK = 'submit_feedback'

export async function submitFeedback(request: SubmitFeedbackRpcRequest): Promise<SubmitFeedbackRpcResponse['submission']> {
  const response = await callRpc<SubmitFeedbackRpcResponse>(RPC_SUBMIT_FEEDBACK, request)
  return response.submission
}

export async function listFeedback(limit = 50): Promise<ListFeedbackRpcResponse['submissions']> {
  const response = await callRpc<ListFeedbackRpcResponse>('admin_list_feedback', { limit })
  return response.submissions
}

