import { paxDB, rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import type { PublishedPollSummary } from '@/services/fetchPollInsightsData';

type AuthActor = {
  uid: string;
  email?: string;
};

export type PollInsightsActor = {
  email: string | null;
  isSuperAdmin: boolean;
};

export async function getPollInsightsActor(auth: AuthActor): Promise<PollInsightsActor> {
  const userDoc = await rezDB.collection(COLLECTIONS.TASK_MASTERS).doc(auth.uid).get();
  const taskMasterData = userDoc.data();
  const rawEmail = auth.email || taskMasterData?.emailAddress || null;
  const email = typeof rawEmail === 'string' ? rawEmail.toLowerCase().trim() : null;
  const isSuperAdmin = taskMasterData?.isSuperAdmin === true;

  return { email, isSuperAdmin };
}

export async function canAccessPollInsights(
  actor: PollInsightsActor,
  paxTaskId: string,
): Promise<boolean> {
  if (actor.isSuperAdmin) return true;
  if (!actor.email) return false;

  const taskDoc = await paxDB.collection(COLLECTIONS.TASKS).doc(paxTaskId).get();
  if (!taskDoc.exists) return false;

  const taskData = taskDoc.data();
  const rawTaskMasterEmail = taskData?.rezTaskMasterEmailAddress;
  const taskMasterEmail =
    typeof rawTaskMasterEmail === 'string'
      ? rawTaskMasterEmail.toLowerCase().trim()
      : null;

  return taskMasterEmail === actor.email;
}

export async function filterAccessiblePollSummaries(
  actor: PollInsightsActor,
  polls: PublishedPollSummary[],
): Promise<PublishedPollSummary[]> {
  if (actor.isSuperAdmin) return polls;
  if (!actor.email || polls.length === 0) return [];

  const taskRefs = polls.map((poll) => paxDB.collection(COLLECTIONS.TASKS).doc(poll.taskId));
  const snaps = await paxDB.getAll(...taskRefs);

  return polls.filter((poll, index) => {
    const taskData = snaps[index]?.data();
    const rawTaskMasterEmail = taskData?.rezTaskMasterEmailAddress;
    const taskMasterEmail =
      typeof rawTaskMasterEmail === 'string'
        ? rawTaskMasterEmail.toLowerCase().trim()
        : null;
    return taskMasterEmail === actor.email;
  });
}
