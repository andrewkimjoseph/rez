import { insightsApi } from '@/lib/insights-api';
import {
  normalizePollQuestions,
  validatePollQuestions,
  type PollQuestionDraft,
} from '@/types/poll';

export interface CreatePollInInsightsData {
  paxTaskId: string;
  title: string;
  category?: string;
  taskMasterEmail: string;
  targetNumberOfParticipants?: number;
  pollQuestions: PollQuestionDraft[];
}

export async function createPollInInsights(data: CreatePollInInsightsData): Promise<string> {
  const pollQuestions = normalizePollQuestions(data.pollQuestions);
  const validationError = validatePollQuestions(pollQuestions);
  if (validationError) {
    throw new Error(validationError);
  }

  const created = await insightsApi<{ id: string }>('/admin/polls', {
    method: 'POST',
    body: JSON.stringify({
      paxTaskId: data.paxTaskId,
      title: data.title,
      category: data.category ?? null,
      taskMasterEmail: data.taskMasterEmail,
      targetNumberOfParticipants: data.targetNumberOfParticipants ?? null,
      pollQuestions,
    }),
  });
  return created.id;
}

export async function deletePollInInsights(paxTaskId: string): Promise<void> {
  await insightsApi(`/admin/polls/${encodeURIComponent(paxTaskId)}`, { method: 'DELETE' });
}
