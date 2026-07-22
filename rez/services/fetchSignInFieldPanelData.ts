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

type QuestionOptionRow = {
  id: string;
  option_text: string;
  sort_order: number;
};

type QuestionAnswerCountRow = {
  question_option_id: string;
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

  let latestPollTitle: string | null = null;
  let latestQuestionText: string | null = null;
  let latestTaskType: string | null = null;
  let questionResults: SignInFieldPanelQuestionResult[] = [];

  if (paxTaskIds.length > 0) {
    const { data: latestAnswerRows, error: latestAnswerError } = await supabase
      .from('answers')
      .select('pax_task_id, question_id')
      .in('pax_task_id', paxTaskIds)
      .order('created_at', { ascending: false })
      .limit(1);

    if (latestAnswerError) {
      throw new Error(latestAnswerError.message);
    }

    const latestPaxTaskId = latestAnswerRows?.[0]?.pax_task_id ?? null;
    const featuredQuestionId = latestAnswerRows?.[0]?.question_id ?? null;
    const latestTask = latestPaxTaskId ? taskByPaxId.get(latestPaxTaskId) : undefined;
    latestPollTitle = latestTask?.title ?? null;
    latestTaskType = latestTask?.type ?? 'poll';

    if (latestPaxTaskId && featuredQuestionId) {
      const { data: questionRow, error: questionError } = await supabase
        .from('questions')
        .select('id, question_text')
        .eq('id', featuredQuestionId)
        .maybeSingle();

      if (questionError) {
        throw new Error(questionError.message);
      }

      latestQuestionText = questionRow?.question_text?.trim() || null;

      const [optionsResult, answerOptionRows] = await Promise.all([
        supabase
          .from('question_options')
          .select('id, option_text, sort_order')
          .eq('question_id', featuredQuestionId)
          .order('sort_order', { ascending: true }),
        fetchPaginatedRows<QuestionAnswerCountRow>(async (from, to) =>
          supabase
            .from('answers')
            .select('question_option_id')
            .eq('pax_task_id', latestPaxTaskId)
            .eq('question_id', featuredQuestionId)
            .order('id', { ascending: true })
            .range(from, to),
        ),
      ]);

      if (optionsResult.error) {
        throw new Error(optionsResult.error.message);
      }

      const options = (optionsResult.data ?? []) as QuestionOptionRow[];
      const counts = new Map(options.map((option) => [option.id, 0]));

      for (const row of answerOptionRows) {
        if (!row.question_option_id) continue;
        counts.set(row.question_option_id, (counts.get(row.question_option_id) ?? 0) + 1);
      }

      questionResults = options.map((option) => ({
        label: option.option_text,
        value: counts.get(option.id) ?? 0,
      }));
    }
  }

  return {
    uniqueRespondents,
    tasksCreated,
    countriesCovered,
    latestPollTitle,
    latestQuestionText,
    latestTaskType,
    questionResults,
    refreshedAt,
  };
}

export const getCachedSignInFieldPanelData = unstable_cache(
  async () => fetchSignInFieldPanelData(),
  ['sign-in-field-panel-v6'],
  { revalidate: 120, tags: ['sign-in-field-panel-v6'] },
);
