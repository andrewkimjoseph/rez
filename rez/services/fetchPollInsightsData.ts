import type { PollInsightRow, PollInsightsData, PollQuestionInsights } from '@/lib/poll-insights';
import { InsightsApiError, insightsApi } from '@/lib/insights-api';

export type PublishedPollSummary = {
  taskId: string;
  taskTitle: string;
  questionText: string;
  questionCount: number;
  responseCount: number;
  targetParticipants: number | null;
  isPublished: boolean;
  deadline: string | null;
  reviewStatus: string;
  isActive: boolean;
};

export type PollInsightsSummaryData = {
  taskTitle: string;
  questions: PollQuestionInsights[];
  targetParticipants: number | null;
  responseCount: number;
  isPublished: boolean;
  deadline: string | null;
  reviewStatus: string;
  isActive: boolean;
};

export type PollInsightsDemographicsData = {
  rows: PollInsightRow[];
};

export async function fetchPollInsightsSummaryByPaxTaskId(
  paxTaskId: string,
): Promise<PollInsightsSummaryData | null> {
  try {
    return await insightsApi<PollInsightsSummaryData>(`/admin/polls/${encodeURIComponent(paxTaskId)}/summary`);
  } catch (error) {
    if (error instanceof InsightsApiError && error.status === 404) return null;
    throw error;
  }
}

export async function fetchPollInsightsDemographicsByPaxTaskId(
  paxTaskId: string,
): Promise<PollInsightsDemographicsData> {
  return insightsApi<PollInsightsDemographicsData>(
    `/admin/polls/${encodeURIComponent(paxTaskId)}/demographics`,
  );
}

export async function fetchAllPublishedPollSummaries(): Promise<PublishedPollSummary[]> {
  const body = await insightsApi<{ polls: PublishedPollSummary[] }>('/admin/polls');
  return body.polls;
}

export function mergeSummaryAndDemographics(
  summary: PollInsightsSummaryData,
  demographics: PollInsightsDemographicsData | null,
): PollInsightsData {
  if (!demographics) {
    return {
      taskTitle: summary.taskTitle,
      questions: summary.questions,
      targetParticipants: summary.targetParticipants,
      isPublished: summary.isPublished,
      deadline: summary.deadline,
      reviewStatus: summary.reviewStatus,
      isActive: summary.isActive,
    };
  }

  const rowsByQuestionId = new Map<string, PollInsightRow[]>();
  for (const row of demographics.rows) {
    if (!row.question_id) continue;
    const list = rowsByQuestionId.get(row.question_id) ?? [];
    list.push(row);
    rowsByQuestionId.set(row.question_id, list);
  }

  return {
    taskTitle: summary.taskTitle,
    questions: summary.questions.map((question) => ({
      ...question,
      rows: rowsByQuestionId.get(question.questionId) ?? [],
    })),
    targetParticipants: summary.targetParticipants,
    isPublished: summary.isPublished,
    deadline: summary.deadline,
    reviewStatus: summary.reviewStatus,
    isActive: summary.isActive,
  };
}
