import { assertAdmin } from "./tournaments/auth";
import {
  getActorLabel,
  parseJsonPayload,
  readNumberField,
  readStringField,
  requireAuthenticatedUserId,
} from "./tournaments/definitions";
import type { RuntimeContext, RuntimeInitializer, RuntimeLogger, RuntimeNakama } from "./tournaments/types";
import { GLOBAL_STORAGE_USER_ID, STORAGE_PERMISSION_NONE, asRecord } from "./progression";
import {
  FEEDBACK_DEFAULT_LIST_LIMIT,
  FEEDBACK_MAX_LIST_LIMIT,
  FEEDBACK_SOURCE_PAGES,
  FEEDBACK_SUBMISSION_COLLECTION,
  FEEDBACK_TYPE_LABELS,
  FEEDBACK_TYPES,
  type FeedbackMatchContext,
  type FeedbackReportedUser,
  type FeedbackSourcePage,
  type FeedbackSubmitter,
  type FeedbackSubmission,
  type FeedbackType,
  type ListFeedbackRpcResponse,
  type SubmitFeedbackRpcRequest,
  type SubmitFeedbackRpcResponse,
} from "../../shared/feedback";

export const RPC_SUBMIT_FEEDBACK = "submit_feedback";
export const RPC_ADMIN_LIST_FEEDBACK = "admin_list_feedback";

type StorageListEntry = {
  value: unknown;
  key?: string;
};

type StorageListResult = {
  objects?: StorageListEntry[];
  cursor?: string | null;
  nextCursor?: string | null;
  next_cursor?: string | null;
};

const normalizeFeedbackType = (value: unknown): FeedbackType | null =>
  typeof value === "string" && (FEEDBACK_TYPES as readonly string[]).includes(value)
    ? (value as FeedbackType)
    : null;

const normalizeFeedbackSourcePage = (value: unknown): FeedbackSourcePage | null =>
  typeof value === "string" && (FEEDBACK_SOURCE_PAGES as readonly string[]).includes(value)
    ? (value as FeedbackSourcePage)
    : null;

const normalizeMatchContext = (value: unknown): FeedbackMatchContext | null => {
  const record = asRecord(value);
  const matchId = readStringField(record, ["matchId", "match_id"]);

  return matchId ? { matchId } : null;
};

const normalizeReportedUser = (value: unknown): FeedbackReportedUser | null => {
  const record = asRecord(value);
  const userId = readStringField(record, ["userId", "user_id"]);
  const username = readStringField(record, ["username", "displayName", "display_name", "name"]);

  if (!userId || !username) {
    return null;
  }

  return {
    userId,
    username,
  };
};

const normalizeSubmitterFromRecord = (value: unknown): FeedbackSubmitter | null => {
  const record = asRecord(value);
  const userId = readStringField(record, ["userId", "user_id"]);
  const username = readStringField(record, ["username", "displayName", "display_name", "name"]);
  const provider = readStringField(record, ["provider"]);
  const nakamaUserId = readStringField(record, ["nakamaUserId", "nakama_user_id"]);

  if (!userId || !username) {
    return null;
  }

  return {
    userId,
    username,
    provider: provider ?? "unknown",
    nakamaUserId,
  };
};

const normalizeSubmitterFromRequest = (ctx: RuntimeContext, payload: SubmitFeedbackRpcRequest): FeedbackSubmitter => {
  const ctxUserId = requireAuthenticatedUserId(ctx);
  const submitterRecord = asRecord(payload.submitter);

  return {
    userId: readStringField(submitterRecord, ["userId", "user_id"]) ?? ctxUserId,
    username:
      readStringField(submitterRecord, ["username", "displayName", "display_name", "name"]) ??
      getActorLabel(ctx),
    provider: readStringField(submitterRecord, ["provider"]) ?? "unknown",
    nakamaUserId: ctxUserId,
  };
};

const buildSubmissionId = (): string =>
  `feedback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const buildStorageKey = (createdAt: string, submissionId: string): string => {
  const reverseTimestamp = String(9_999_999_999_999 - Date.parse(createdAt)).padStart(13, "0");
  return `${reverseTimestamp}-${submissionId}`;
};

const normalizeStoredSubmission = (value: unknown): FeedbackSubmission | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const id = readStringField(record, ["id", "submissionId", "submission_id"]);
  const type = normalizeFeedbackType(readStringField(record, ["type"]));
  const message = readStringField(record, ["message", "body"]);
  const sourcePage = normalizeFeedbackSourcePage(readStringField(record, ["sourcePage", "source_page"]));
  const createdAt = readStringField(record, ["createdAt", "created_at"]);
  const submitter = normalizeSubmitterFromRecord(record.submitter);
  const matchContext = normalizeMatchContext(record.matchContext ?? record.match_context);
  const reportedUser = normalizeReportedUser(record.reportedUser ?? record.reported_user);

  if (!id || !type || !message || !sourcePage || !createdAt || !submitter) {
    return null;
  }

  return {
    id,
    type,
    message: message.trim(),
    sourcePage,
    submitter,
    matchContext,
    reportedUser,
    createdAt,
  };
};

const normalizeStorageListResult = (value: unknown): { objects: StorageListEntry[]; cursor: string | null } => {
  const record = asRecord(value);
  const objects = Array.isArray(record?.objects) ? (record.objects as StorageListEntry[]) : [];
  const cursor = readStringField(record, ["cursor", "nextCursor", "next_cursor"]);

  return {
    objects,
    cursor,
  };
};

const normalizeSubmittedMessage = (payload: SubmitFeedbackRpcRequest): string => {
  const message = readStringField(payload, ["message", "body", "text"]) ?? "";
  if (!message) {
    throw new Error("Feedback message is required.");
  }

  return message;
};

const normalizeSubmissionPayload = (ctx: RuntimeContext, payload: SubmitFeedbackRpcRequest): FeedbackSubmission => {
  const type = normalizeFeedbackType(readStringField(payload, ["type", "feedbackType", "feedback_type"]));
  if (!type) {
    throw new Error(`Feedback category must be one of: ${FEEDBACK_TYPE_LABELS.bug}, ${FEEDBACK_TYPE_LABELS.feature_request}, or ${FEEDBACK_TYPE_LABELS.player_report}.`);
  }

  const sourcePage = normalizeFeedbackSourcePage(readStringField(payload, ["sourcePage", "source_page"]));
  if (!sourcePage) {
    throw new Error("Feedback source page must be one of: home, play_online, or match.");
  }

  return {
    id: buildSubmissionId(),
    type,
    message: normalizeSubmittedMessage(payload),
    sourcePage,
    submitter: normalizeSubmitterFromRequest(ctx, payload),
    matchContext: normalizeMatchContext(payload.matchContext),
    reportedUser: normalizeReportedUser(payload.reportedUser),
    createdAt: new Date().toISOString(),
  };
};

export function rpcSubmitFeedback(
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string {
  const request = parseJsonPayload(payload) as SubmitFeedbackRpcRequest;
  const submission = normalizeSubmissionPayload(ctx, request);
  const storageKey = buildStorageKey(submission.createdAt, submission.id);

  nk.storageWrite([
    {
      collection: FEEDBACK_SUBMISSION_COLLECTION,
      key: storageKey,
      userId: GLOBAL_STORAGE_USER_ID,
      value: submission,
      permissionRead: STORAGE_PERMISSION_NONE,
      permissionWrite: STORAGE_PERMISSION_NONE,
    },
  ]);

  logger.info(
    "Stored feedback submission %s from %s on %s.",
    submission.id,
    submission.submitter.nakamaUserId ?? submission.submitter.userId,
    submission.sourcePage,
  );

  return JSON.stringify({ submission } satisfies SubmitFeedbackRpcResponse);
}

export function rpcAdminListFeedback(
  ctx: RuntimeContext,
  logger: RuntimeLogger,
  nk: RuntimeNakama,
  payload: string,
): string {
  assertAdmin(ctx, "viewer", nk);

  const request = parseJsonPayload(payload);
  const requestedLimit = readNumberField(request, ["limit"]);
  const limit = Math.max(
    1,
    Math.min(FEEDBACK_MAX_LIST_LIMIT, Math.floor(requestedLimit ?? FEEDBACK_DEFAULT_LIST_LIMIT)),
  );

  const rawEntries: StorageListEntry[] = [];
  let cursor = "";

  for (let page = 0; page < 50; page += 1) {
    const rawResult = nk.storageList(GLOBAL_STORAGE_USER_ID, FEEDBACK_SUBMISSION_COLLECTION, FEEDBACK_MAX_LIST_LIMIT, cursor) as StorageListResult;
    const result = normalizeStorageListResult(rawResult);
    rawEntries.push(...result.objects);

    if (!result.cursor) {
      break;
    }

    cursor = result.cursor;
  }

  const submissions = rawEntries
    .map((entry) => normalizeStoredSubmission(entry.value))
    .filter((entry): entry is FeedbackSubmission => Boolean(entry))
    .sort((left, right) => {
      const byCreatedAt = right.createdAt.localeCompare(left.createdAt);
      return byCreatedAt !== 0 ? byCreatedAt : right.id.localeCompare(left.id);
    })
    .slice(0, limit);

  logger.info("Loaded %d feedback submissions for admin review.", submissions.length);

  return JSON.stringify({ submissions } satisfies ListFeedbackRpcResponse);
}

export const registerFeedbackRpcs = (initializer: RuntimeInitializer): void => {
  initializer.registerRpc(RPC_SUBMIT_FEEDBACK, rpcSubmitFeedback);
  initializer.registerRpc(RPC_ADMIN_LIST_FEEDBACK, rpcAdminListFeedback);
};
