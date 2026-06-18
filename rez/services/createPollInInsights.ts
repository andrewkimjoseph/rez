import { getSupabaseAdmin } from '@/lib/supabase/server';
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
  const supabase = getSupabaseAdmin();
  const pollQuestions = normalizePollQuestions(data.pollQuestions);
  const validationError = validatePollQuestions(pollQuestions);
  if (validationError) {
    throw new Error(validationError);
  }

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      pax_task_id: data.paxTaskId,
      title: data.title,
      type: 'poll',
      category: data.category ?? null,
      task_master_email: data.taskMasterEmail,
      review_status: 'pending',
      is_published: false,
      target_number_of_participants: data.targetNumberOfParticipants ?? null,
    })
    .select('id')
    .single();

  if (taskError || !task) {
    throw new Error(taskError?.message ?? 'Failed to create poll task in Insights');
  }

  try {
    for (let i = 0; i < pollQuestions.length; i++) {
      const questionDraft = pollQuestions[i];
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert({
          task_id: task.id,
          question_text: questionDraft.questionText,
          sort_order: i,
        })
        .select('id')
        .single();

      if (questionError || !question) {
        throw new Error(questionError?.message ?? 'Failed to create poll question');
      }

      const optionRows = questionDraft.options.map((optionText, index) => ({
        question_id: question.id,
        option_text: optionText,
        sort_order: index,
      }));

      const { error: optionsError } = await supabase.from('question_options').insert(optionRows);
      if (optionsError) {
        throw new Error(optionsError.message);
      }
    }
  } catch (error) {
    await supabase.from('tasks').delete().eq('id', task.id);
    throw error;
  }

  return task.id;
}

export async function deletePollInInsights(paxTaskId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from('tasks').delete().eq('pax_task_id', paxTaskId);
}
