import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import {
  coerceFirestoreDeadline,
  isPollInactiveReviewStatus,
  isPollPublished,
} from '@/lib/poll-publication-state';
import {
  normalizePollQuestions,
  validatePollQuestions,
  validatePollQuestionsTextOnly,
  type PollQuestionDraft,
} from '@/types/poll';
import { fetchPollContentByPaxTaskId, getPollResponseCount } from '@/services/fetchPollContent';

export type UpdatePollInInsightsOptions = {
  adminOverride?: boolean;
};

export type SyncPollPublicationInput = {
  reviewStatus: string | null;
  isAvailable: boolean | null;
  deadline: string | null;
};

export type SyncPollTaskMetadata = {
  title: string;
  category: string | null;
  targetNumberOfParticipants: number | null;
};

export function buildPollPublicationUpdate(input: SyncPollPublicationInput) {
  const reviewStatus = input.reviewStatus ?? 'pending';
  const isActive =
    !isPollInactiveReviewStatus(reviewStatus) && input.isAvailable === true;
  const deadline = input.deadline;

  return {
    review_status: reviewStatus,
    is_active: isActive,
    deadline,
    is_published: isPollPublished(reviewStatus),
  };
}

export function buildPollInsightsTaskUpdate(
  publication: SyncPollPublicationInput,
  metadata: SyncPollTaskMetadata,
) {
  return {
    ...buildPollPublicationUpdate(publication),
    title: metadata.title,
    category: metadata.category,
    target_number_of_participants: metadata.targetNumberOfParticipants,
  };
}

async function applyPollInsightsTaskUpdate(
  paxTaskId: string,
  update: ReturnType<typeof buildPollPublicationUpdate> & {
    title?: string;
    category?: string | null;
    target_number_of_participants?: number | null;
  },
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('tasks').update(update).eq('pax_task_id', paxTaskId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncPollPublication(
  paxTaskId: string,
  reviewStatus: string,
  isAvailable?: boolean,
  deadline?: string | null,
): Promise<void> {
  await applyPollInsightsTaskUpdate(
    paxTaskId,
    buildPollPublicationUpdate({
      reviewStatus,
      isAvailable: isAvailable ?? false,
      deadline: deadline ?? null,
    }),
  );
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

  const update = buildPollInsightsTaskUpdate(
    {
      reviewStatus: taskData.reviewStatus ?? 'pending',
      isAvailable: taskData.isAvailable ?? false,
      deadline: coerceFirestoreDeadline(taskData.deadline),
    },
    {
      title: taskData.title ?? '',
      category: taskData.category ?? null,
      targetNumberOfParticipants: taskData.targetNumberOfParticipants ?? null,
    },
  );

  await applyPollInsightsTaskUpdate(paxTaskId, update);
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
  const supabase = getSupabaseAdmin();
  const adminOverride = options?.adminOverride === true;

  const taskUpdate: {
    title?: string;
    category?: string;
    target_number_of_participants?: number;
    review_status?: string;
    is_published?: boolean;
    is_active?: boolean;
  } = {};
  if (data.title !== undefined) taskUpdate.title = data.title;
  if (data.category !== undefined) taskUpdate.category = data.category;
  if (data.targetNumberOfParticipants !== undefined) {
    taskUpdate.target_number_of_participants = data.targetNumberOfParticipants;
  }
  if (data.reviewStatus !== undefined) {
    taskUpdate.review_status = data.reviewStatus;
    taskUpdate.is_published = isPollPublished(data.reviewStatus);
    if (isPollInactiveReviewStatus(data.reviewStatus)) {
      taskUpdate.is_active = false;
    }
  }

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, is_published')
    .eq('pax_task_id', paxTaskId)
    .single();

  if (taskError || !task) {
    throw new Error(taskError?.message ?? 'Poll task not found in Insights');
  }

  if (data.pollQuestions !== undefined) {
    const responseCount = await getPollResponseCount(paxTaskId);
    if (responseCount > 0 && !adminOverride) {
      throw new Error('Poll questions cannot be changed after responses have been received');
    }

    const pollQuestions = normalizePollQuestions(data.pollQuestions);

    if (responseCount > 0 && adminOverride) {
      const existing = await fetchPollContentByPaxTaskId(paxTaskId);
      if (!existing) {
        throw new Error('Poll content not found in Insights');
      }
      const textOnlyError = validatePollQuestionsTextOnly(existing.pollQuestions, pollQuestions);
      if (textOnlyError) {
        throw new Error(textOnlyError);
      }
      await applyPollQuestionsTextOnlyUpdate(supabase, task.id, pollQuestions);
    } else {
      const validationError = validatePollQuestions(pollQuestions);
      if (validationError) {
        throw new Error(validationError);
      }

      if (task.is_published && !adminOverride) {
        taskUpdate.is_published = false;
        taskUpdate.review_status = 'pending';
      }

      await applyPollQuestionsFullUpdate(supabase, task.id, pollQuestions);
    }
  }

  if (Object.keys(taskUpdate).length > 0) {
    const { error } = await supabase.from('tasks').update(taskUpdate).eq('pax_task_id', paxTaskId);
    if (error) throw new Error(error.message);
  }
}

async function applyPollQuestionsTextOnlyUpdate(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  taskId: string,
  pollQuestions: PollQuestionDraft[],
): Promise<void> {
  const { data: existingQuestions, error: existingError } = await supabase
    .from('questions')
    .select('id, sort_order')
    .eq('task_id', taskId)
    .order('sort_order', { ascending: true });

  if (existingError) {
    throw new Error(existingError.message);
  }

  for (let i = 0; i < pollQuestions.length; i++) {
    const draft = pollQuestions[i];
    const questionId = existingQuestions?.[i]?.id;
    if (!questionId) {
      throw new Error(`Question ${i + 1} not found in Insights`);
    }

    const { error: updateError } = await supabase
      .from('questions')
      .update({ question_text: draft.questionText })
      .eq('id', questionId);
    if (updateError) throw new Error(updateError.message);

    const { data: existingOptions, error: optionsError } = await supabase
      .from('question_options')
      .select('id, sort_order')
      .eq('question_id', questionId)
      .order('sort_order', { ascending: true });

    if (optionsError) throw new Error(optionsError.message);

    for (let j = 0; j < draft.options.length; j++) {
      const optionId = existingOptions?.[j]?.id;
      if (!optionId) {
        throw new Error(`Question ${i + 1}, option ${j + 1} not found in Insights`);
      }
      const { error: optionUpdateError } = await supabase
        .from('question_options')
        .update({ option_text: draft.options[j] })
        .eq('id', optionId);
      if (optionUpdateError) throw new Error(optionUpdateError.message);
    }
  }
}

async function applyPollQuestionsFullUpdate(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  taskId: string,
  pollQuestions: PollQuestionDraft[],
): Promise<void> {
  const { data: existingQuestions, error: existingError } = await supabase
    .from('questions')
    .select('id, sort_order')
    .eq('task_id', taskId)
    .order('sort_order', { ascending: true });

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingBySort = new Map(
    (existingQuestions ?? []).map((q) => [q.sort_order, q.id]),
  );
  const keptQuestionIds = new Set<string>();

  for (let i = 0; i < pollQuestions.length; i++) {
    const draft = pollQuestions[i];
    const existingId = existingBySort.get(i);

    let questionId: string;
    if (existingId) {
      const { error: updateError } = await supabase
        .from('questions')
        .update({ question_text: draft.questionText, sort_order: i })
        .eq('id', existingId);
      if (updateError) throw new Error(updateError.message);
      questionId = existingId;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('questions')
        .insert({
          task_id: taskId,
          question_text: draft.questionText,
          sort_order: i,
        })
        .select('id')
        .single();
      if (insertError || !inserted) {
        throw new Error(insertError?.message ?? 'Failed to insert poll question');
      }
      questionId = inserted.id;
    }

    keptQuestionIds.add(questionId);

    await supabase.from('question_options').delete().eq('question_id', questionId);
    const optionRows = draft.options.map((optionText, index) => ({
      question_id: questionId,
      option_text: optionText,
      sort_order: index,
    }));
    const { error: optionsError } = await supabase.from('question_options').insert(optionRows);
    if (optionsError) throw new Error(optionsError.message);
  }

  const toDelete = (existingQuestions ?? [])
    .map((q) => q.id)
    .filter((id) => !keptQuestionIds.has(id));

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase.from('questions').delete().in('id', toDelete);
    if (deleteError) throw new Error(deleteError.message);
  }
}
