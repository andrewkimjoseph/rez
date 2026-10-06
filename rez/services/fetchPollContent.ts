import { InsightsApiError, insightsApi } from '@/lib/insights-api';
import type { PollQuestionDraft } from '@/types/poll';

export type PollContentResponse = {
  pollQuestions: PollQuestionDraft[];
  responseCount: number;
  canEditQuestions: boolean;
};

export async function fetchPollContentByPaxTaskId(
  paxTaskId: string,
): Promise<PollContentResponse | null> {
  try {
    return await insightsApi<PollContentResponse>(`/admin/polls/${encodeURIComponent(paxTaskId)}/content`);
  } catch (error) {
    if (error instanceof InsightsApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getPollResponseCount(paxTaskId: string): Promise<number> {
  const content = await fetchPollContentByPaxTaskId(paxTaskId);
  return content?.responseCount ?? 0;
}
