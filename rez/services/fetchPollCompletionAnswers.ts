import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { insightsApi } from '@/lib/insights-api';

export type PollCompletionAnswer = {
  questionId: string;
  questionText: string;
  optionText: string;
  sortOrder: number;
  answeredAt: string;
};

export type PollCompletionAnswersResponse = {
  taskId: string;
  completionId: string | null;
  participantId: string;
  country: string | null;
  age: number | null;
  answers: PollCompletionAnswer[];
};

export async function fetchPollCompletionAnswers(
  paxTaskId: string,
  lookup: { completionId?: string | null; participantId?: string | null },
): Promise<PollCompletionAnswersResponse | null> {
  const { completionId, participantId } = lookup;

  if (!completionId && !participantId) {
    throw new Error('completionId or participantId is required');
  }

  const taskDoc = await paxDB.collection(COLLECTIONS.TASKS).doc(paxTaskId).get();
  if (!taskDoc.exists) {
    return null;
  }

  const taskData = taskDoc.data();
  if (taskData?.type !== 'answerPoll') {
    throw new Error('Task is not a poll');
  }

  const params = new URLSearchParams();
  if (completionId) params.set('completionId', completionId);
  if (participantId) params.set('participantId', participantId);

  return insightsApi<PollCompletionAnswersResponse>(
    `/admin/polls/${encodeURIComponent(paxTaskId)}/completion-answers?${params.toString()}`,
  );
}
