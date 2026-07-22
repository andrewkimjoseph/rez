import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';

const SUPABASE_PAGE_SIZE = 1000;
const IN_FILTER_BATCH_SIZE = 100;

type PollTaskRow = {
  id: string;
  pax_task_id: string;
  title: string;
  category: string | null;
  type: string | null;
  is_active: boolean;
};

type AnswerParticipantRow = {
  participant_id: string | null;
  pax_task_id: string;
};

type RecentAnswerRow = {
  created_at: string;
  participant_id: string;
  pax_task_id: string;
};

async function fetchPaginatedRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await fetchPage(from, from + SUPABASE_PAGE_SIZE - 1);
    if (error) {
      throw new Error(error.message);
    }

    if (!data?.length) {
      break;
    }

    rows.push(...data);

    if (data.length < SUPABASE_PAGE_SIZE) {
      break;
    }

    from += SUPABASE_PAGE_SIZE;
  }

  return rows;
}

export type SignInFieldPanelResponse = {
  taskTitle: string;
  taskType: string | null;
  category: string | null;
  location: string | null;
  answeredAt: string;
};

export type SignInFieldPanelData = {
  uniqueRespondents: number;
  tasksCreated: number;
  countriesCovered: number;
  recentResponses: SignInFieldPanelResponse[];
  refreshedAt: string;
};

export async function fetchSignInFieldPanelData(): Promise<SignInFieldPanelData> {
  const supabase = getSupabaseAdmin();
  const refreshedAt = new Date().toISOString();

  const [tasksCountSnapshot, allAnswers, tasksResult, completionIdsSnapshot] = await Promise.all([
    paxDB.collection(COLLECTIONS.TASKS).count().get(),
    fetchPaginatedRows<AnswerParticipantRow>(async (from, to) =>
      supabase
        .from('answers')
        .select('participant_id, pax_task_id')
        .order('id', { ascending: true })
        .range(from, to),
    ),
    supabase
      .from('tasks')
      .select('id, pax_task_id, title, category, type, is_active')
      .in('review_status', ['published', 'archived']),
    paxDB.collection(COLLECTIONS.TASK_COMPLETIONS).select('participantId').get(),
  ]);

  if (tasksResult.error) {
    throw new Error(tasksResult.error.message);
  }

  const tasksCreated = tasksCountSnapshot.data().count;
  const supabaseParticipantIds = new Set(
    allAnswers
      .map((answer) => answer.participant_id)
      .filter((participantId): participantId is string => typeof participantId === 'string' && participantId.length > 0),
  );
  const firestoreParticipantIds = new Set(
    completionIdsSnapshot.docs
      .map((doc) => {
        const participantId = doc.data().participantId;
        return typeof participantId === 'string' && participantId.length > 0 ? participantId : null;
      })
      .filter((participantId): participantId is string => participantId !== null),
  );
  const allParticipantIds = new Set<string>([
    ...supabaseParticipantIds,
    ...firestoreParticipantIds,
  ]);
  const uniqueRespondents = allParticipantIds.size;

  const pollTasks = (tasksResult.data ?? []) as PollTaskRow[];
  const paxTaskIds = pollTasks.map((task) => task.pax_task_id);
  const taskByPaxId = new Map(pollTasks.map((task) => [task.pax_task_id, task]));

  const participantIds = Array.from(allParticipantIds);

  let countriesCovered = 0;
  if (participantIds.length > 0) {
    const countries = new Set<string>();
    const supabaseParticipantIdsArray = Array.from(supabaseParticipantIds);
    for (let i = 0; i < supabaseParticipantIdsArray.length; i += IN_FILTER_BATCH_SIZE) {
      const ids = supabaseParticipantIdsArray.slice(i, i + IN_FILTER_BATCH_SIZE);
      const { data: participants, error: participantsError } = await supabase
        .from('participants')
        .select('country')
        .in('id', ids);

      if (participantsError) {
        throw new Error(participantsError.message);
      }

      for (const participant of participants ?? []) {
        const country = participant.country?.trim();
        if (country) {
          countries.add(country);
        }
      }
    }
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

    countriesCovered = countries.size;
  }

  let recentRows: RecentAnswerRow[] = [];
  if (paxTaskIds.length > 0) {
    const { data: recentAnswers, error: recentError } = await supabase
      .from('answers')
      .select('created_at, participant_id, pax_task_id')
      .in('pax_task_id', paxTaskIds)
      .order('created_at', { ascending: false })
      .limit(4);

    if (recentError) {
      throw new Error(recentError.message);
    }

    recentRows = (recentAnswers ?? []) as RecentAnswerRow[];
  }
  const recentParticipantIds = Array.from(new Set(recentRows.map((row) => row.participant_id)));

  let countryByParticipantId = new Map<string, string | null>();
  if (recentParticipantIds.length > 0) {
    const { data: recentParticipants, error: recentParticipantsError } = await supabase
      .from('participants')
      .select('id, country')
      .in('id', recentParticipantIds);

    if (recentParticipantsError) {
      throw new Error(recentParticipantsError.message);
    }

    countryByParticipantId = new Map(
      (recentParticipants ?? []).map((participant) => [participant.id, participant.country]),
    );
  }

  const recentResponses: SignInFieldPanelResponse[] = recentRows.map((row) => {
    const task = taskByPaxId.get(row.pax_task_id);
    return {
      taskTitle: task?.title ?? 'Poll response',
      taskType: task?.type ?? null,
      category: task?.category ?? null,
      location: countryByParticipantId.get(row.participant_id) ?? null,
      answeredAt: row.created_at,
    };
  });

  return {
    uniqueRespondents,
    tasksCreated,
    countriesCovered,
    recentResponses,
    refreshedAt,
  };
}

export const getCachedSignInFieldPanelData = unstable_cache(
  async () => fetchSignInFieldPanelData(),
  ['sign-in-field-panel-v3'],
  { revalidate: 120, tags: ['sign-in-field-panel-v3'] },
);
