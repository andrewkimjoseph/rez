import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { insightsApi } from '@/lib/insights-api';
import { coerceFirestoreDeadline } from '@/lib/poll-publication-state';
import type { PollQuestionDraft } from '@/types/poll';

export type UpdatePollInInsightsOptions = {
  adminOverride?: boolean;
};

export async function syncPollPublication(
  paxTaskId: string,
  reviewStatus: string,
  isAvailable?: boolean,
  deadline?: string | null,
): Promise<void> {
  await insightsApi(`/admin/polls/${encodeURIComponent(paxTaskId)}/sync-publication`, {
    method: 'POST',
    body: JSON.stringify({
      reviewStatus,
      isAvailable: isAvailable ?? false,
      deadline: deadline ?? null,
    }),
  });
}

export async function syncPollFromFirestoreTask(paxTaskId: string): Promise<void> {
  const taskDoc = await paxDB.collection(COLLECTIONS.TASKS).doc(paxTaskId).get();
  if (!taskDoc.exists) {
    throw new Error('Task not found in Pax Firestore');
  }

  const taskData = taskDoc.data();
  if (taskData?.type !== 'answerPoll') {
    return;
  }

  await insightsApi(`/admin/polls/${encodeURIComponent(paxTaskId)}/sync-publication`, {
    method: 'POST',
    body: JSON.stringify({
      reviewStatus: taskData.reviewStatus ?? 'pending',
      isAvailable: taskData.isAvailable ?? false,
      deadline: coerceFirestoreDeadline(taskData.deadline),
      title: taskData.title ?? '',
      category: taskData.category ?? null,
      targetNumberOfParticipants: taskData.targetNumberOfParticipants ?? null,
    }),
  });
}

export async function updatePollInInsights(
  paxTaskId: string,
  data: {
    title?: string;
    category?: string;
    targetNumberOfParticipants?: number;
    pollQuestions?: PollQuestionDraft[];
    reviewStatus?: string;
  },
  options?: UpdatePollInInsightsOptions,
): Promise<void> {
  await insightsApi(`/admin/polls/${encodeURIComponent(paxTaskId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...data,
      adminOverride: options?.adminOverride === true,
    }),
  });
}
