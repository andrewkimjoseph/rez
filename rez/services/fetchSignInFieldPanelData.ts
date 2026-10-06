import { unstable_cache } from 'next/cache';
import { insightsApi } from '@/lib/insights-api';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';

const IN_FILTER_BATCH_SIZE = 100;

export type SignInFieldPanelQuestionResult = {
  label: string;
  value: number;
};

export type SignInFieldPanelData = {
  uniqueRespondents: number;
  tasksCreated: number;
  countriesCovered: number;
  latestPollTitle: string | null;
  latestQuestionText: string | null;
  latestTaskType: string | null;
  questionResults: SignInFieldPanelQuestionResult[];
  refreshedAt: string;
};

type SignInPanelSupabaseData = {
  supabaseParticipantIds: string[];
  countries: string[];
  latestPollTitle: string | null;
  latestQuestionText: string | null;
  latestTaskType: string | null;
  questionResults: SignInFieldPanelQuestionResult[];
  refreshedAt: string;
};

export async function fetchSignInFieldPanelData(): Promise<SignInFieldPanelData> {
  const [panel, tasksCountSnapshot, completionIdsSnapshot] = await Promise.all([
    insightsApi<SignInPanelSupabaseData>('/admin/sign-in-panel'),
    paxDB.collection(COLLECTIONS.TASKS).count().get(),
    paxDB.collection(COLLECTIONS.TASK_COMPLETIONS).select('participantId').get(),
  ]);

  const tasksCreated = tasksCountSnapshot.data().count;
  const supabaseParticipantIds = new Set(panel.supabaseParticipantIds);
  const firestoreParticipantIds = new Set(
    completionIdsSnapshot.docs
      .map((doc) => {
        const participantId = doc.data().participantId;
        return typeof participantId === 'string' && participantId.length > 0 ? participantId : null;
      })
      .filter((participantId): participantId is string => participantId !== null),
  );
  const uniqueRespondents = new Set<string>([
    ...supabaseParticipantIds,
    ...firestoreParticipantIds,
  ]).size;

  const countries = new Set(panel.countries);
  const firestoreParticipantIdsArray = Array.from(firestoreParticipantIds);
  for (let i = 0; i < firestoreParticipantIdsArray.length; i += IN_FILTER_BATCH_SIZE) {
    const ids = firestoreParticipantIdsArray.slice(i, i + IN_FILTER_BATCH_SIZE);
    const docRefs = ids.map((id) => paxDB.collection(COLLECTIONS.PARTICIPANTS).doc(id));
    const docs = await paxDB.getAll(...docRefs);
    for (const doc of docs) {
      if (!doc.exists) continue;
      const country = doc.data()?.country;
      if (typeof country === 'string' && country.trim().length > 0) {
        countries.add(country.trim());
      }
    }
  }

  return {
    uniqueRespondents,
    tasksCreated,
    countriesCovered: countries.size,
    latestPollTitle: panel.latestPollTitle,
    latestQuestionText: panel.latestQuestionText,
    latestTaskType: panel.latestTaskType,
    questionResults: panel.questionResults,
    refreshedAt: panel.refreshedAt,
  };
}

export const getCachedSignInFieldPanelData = unstable_cache(
  async () => fetchSignInFieldPanelData(),
  ['sign-in-field-panel-v6'],
  { revalidate: 120, tags: ['sign-in-field-panel-v6'] },
);
