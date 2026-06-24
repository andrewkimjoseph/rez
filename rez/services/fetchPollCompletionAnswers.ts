import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { calculateAgeFromDateOfBirth } from '@/lib/poll-insights';
import { getSupabaseAdmin } from '@/lib/supabase/server';

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

async function fetchParticipantDemographics(participantId: string | null | undefined) {
  if (!participantId) {
    return { country: null, age: null };
  }

  const supabase = getSupabaseAdmin();
  const { data: participant, error } = await supabase
    .from('participants')
    .select('country, date_of_birth')
    .eq('id', participantId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    country: participant?.country ?? null,
    age: calculateAgeFromDateOfBirth(participant?.date_of_birth ?? null),
  };
}

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

  const supabase = getSupabaseAdmin();

  let answerRows: {
    id: string;
    question_id: string;
    question_option_id: string;
    participant_id: string;
    created_at: string;
    pax_task_completion_id: string | null;
  }[] = [];

  const runQuery = async (filter: { completionId?: string; participantId?: string }) => {
    let query = supabase
      .from('answers')
      .select('id, question_id, question_option_id, participant_id, created_at, pax_task_completion_id')
      .eq('pax_task_id', paxTaskId);

    if (filter.completionId) {
      query = query.eq('pax_task_completion_id', filter.completionId);
    } else if (filter.participantId) {
      query = query.eq('participant_id', filter.participantId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  };

  if (completionId) {
    answerRows = await runQuery({ completionId });
  }

  if (!answerRows.length && participantId) {
    answerRows = await runQuery({ participantId });
  }

  if (!answerRows?.length) {
    const resolvedParticipantId = participantId ?? '';
    const demographics = await fetchParticipantDemographics(
      resolvedParticipantId || null,
    );

    return {
      taskId: paxTaskId,
      completionId: completionId ?? null,
      participantId: resolvedParticipantId,
      country: demographics.country,
      age: demographics.age,
      answers: [],
    };
  }

  const resolvedParticipantId = participantId ?? answerRows[0].participant_id;
  const resolvedCompletionId = completionId ?? answerRows[0].pax_task_completion_id ?? null;

  const questionIds = Array.from(new Set(answerRows.map((row) => row.question_id)));
  const optionIds = Array.from(new Set(answerRows.map((row) => row.question_option_id)));

  const [questionsResult, optionsResult, demographics] = await Promise.all([
    supabase
      .from('questions')
      .select('id, question_text, sort_order')
      .in('id', questionIds),
    supabase
      .from('question_options')
      .select('id, option_text')
      .in('id', optionIds),
    fetchParticipantDemographics(resolvedParticipantId),
  ]);

  const { data: questions, error: questionsError } = questionsResult;
  const { data: optionRows, error: optionsError } = optionsResult;

  if (questionsError) {
    throw new Error(questionsError.message);
  }

  if (optionsError) {
    throw new Error(optionsError.message);
  }

  const questionById = new Map((questions ?? []).map((q) => [q.id, q]));
  const optionById = new Map((optionRows ?? []).map((o) => [o.id, o]));

  const answers: PollCompletionAnswer[] = answerRows
    .map((row) => {
      const question = questionById.get(row.question_id);
      const option = optionById.get(row.question_option_id);
      if (!question || !option) {
        return null;
      }
      return {
        questionId: row.question_id,
        questionText: question.question_text,
        optionText: option.option_text,
        sortOrder: question.sort_order,
        answeredAt: row.created_at,
      };
    })
    .filter((answer): answer is PollCompletionAnswer => answer !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    taskId: paxTaskId,
    completionId: resolvedCompletionId,
    participantId: resolvedParticipantId,
    country: demographics.country,
    age: demographics.age,
    answers,
  };
}
