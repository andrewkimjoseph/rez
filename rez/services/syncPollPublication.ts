import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import {
  coerceFirestoreDeadline,
  isPollPublished,
} from '@/lib/poll-publication-state';
import {
  normalizePollQuestions,
  validatePollQuestions,
  type PollQuestionDraft,
} from '@/types/poll';
import { getPollResponseCount } from '@/services/fetchPollContent';

export type SyncPollPublicationInput = {
  reviewStatus: string | null;
  isAvailable: boolean | null;
  deadline: string | null;
};

export function buildPollPublicationUpdate(input: SyncPollPublicationInput) {
  const reviewStatus = input.reviewStatus ?? 'pending';
  const isActive = input.isAvailable === true;
  const deadline = input.deadline;

  return {
    review_status: reviewStatus,
    is_active: isActive,
    deadline,
    is_published: isPollPublished(reviewStatus),
  };
}

export async function syncPollPublication(
  paxTaskId: string,
  reviewStatus: string,
  isAvailable?: boolean,
  deadline?: string | null,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const update = buildPollPublicationUpdate({
    reviewStatus,
    isAvailable: isAvailable ?? false,
    deadline: deadline ?? null,
  });

  const { error } = await supabase.from('tasks').update(update).eq('pax_task_id', paxTaskId);

  if (error) {
    throw new Error(error.message);
  }
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

  await syncPollPublication(
    paxTaskId,
    taskData.reviewStatus ?? 'pending',
    taskData.isAvailable ?? false,
    coerceFirestoreDeadline(taskData.deadline),
  );
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
): Promise<void> {
  const supabase = getSupabaseAdmin();

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
    if (responseCount > 0) {
      throw new Error('Poll questions cannot be changed after responses have been received');
    }

    const pollQuestions = normalizePollQuestions(data.pollQuestions);
    const validationError = validatePollQuestions(pollQuestions);
    if (validationError) {
      throw new Error(validationError);
    }

    if (task.is_published) {
      taskUpdate.is_published = false;
      taskUpdate.review_status = 'pending';
    }

    const { data: existingQuestions, error: existingError } = await supabase
      .from('questions')
      .select('id, sort_order')
      .eq('task_id', task.id)
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
            task_id: task.id,
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

  if (Object.keys(taskUpdate).length > 0) {
    const { error } = await supabase.from('tasks').update(taskUpdate).eq('pax_task_id', paxTaskId);
    if (error) throw new Error(error.message);
  }
}
