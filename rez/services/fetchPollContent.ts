import { getSupabaseAdmin } from '@/lib/supabase/server';
import {
  normalizePollQuestions,
  validatePollQuestions,
  type PollQuestionDraft,
} from '@/types/poll';

export type PollContentResponse = {
  pollQuestions: PollQuestionDraft[];
  responseCount: number;
  canEditQuestions: boolean;
};

export async function fetchPollContentByPaxTaskId(
  paxTaskId: string,
): Promise<PollContentResponse | null> {
  const supabase = getSupabaseAdmin();

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id')
    .eq('pax_task_id', paxTaskId)
    .single();

  if (taskError || !task) {
    return null;
  }

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, question_text, sort_order')
    .eq('task_id', task.id)
    .order('sort_order', { ascending: true });

  if (questionsError) {
    throw new Error(questionsError.message);
  }

  const questionIds = (questions ?? []).map((q) => q.id);
  let optionsByQuestionId = new Map<string, { option_text: string; sort_order: number }[]>();

  if (questionIds.length > 0) {
    const { data: options, error: optionsError } = await supabase
      .from('question_options')
      .select('question_id, option_text, sort_order')
      .in('question_id', questionIds)
      .order('sort_order', { ascending: true });

    if (optionsError) {
      throw new Error(optionsError.message);
    }

    for (const option of options ?? []) {
      const list = optionsByQuestionId.get(option.question_id) ?? [];
      list.push({ option_text: option.option_text, sort_order: option.sort_order });
      optionsByQuestionId.set(option.question_id, list);
    }
  }

  const pollQuestions: PollQuestionDraft[] = (questions ?? []).map((q) => ({
    questionText: q.question_text,
    options: (optionsByQuestionId.get(q.id) ?? []).map((o) => o.option_text),
  }));

  const { data: answers, error: answersError } = await supabase
    .from('answers')
    .select('participant_id')
    .eq('pax_task_id', paxTaskId);

  if (answersError) {
    throw new Error(answersError.message);
  }

  const responseCount = new Set((answers ?? []).map((a) => a.participant_id)).size;

  return {
    pollQuestions,
    responseCount,
    canEditQuestions: responseCount === 0,
  };
}

export async function getPollResponseCount(paxTaskId: string): Promise<number> {
  const content = await fetchPollContentByPaxTaskId(paxTaskId);
  return content?.responseCount ?? 0;
}
