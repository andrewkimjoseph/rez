import { getSupabaseAdmin } from '@/lib/supabase/server';
import {
  calculateAgeFromDateOfBirth,
  completedParticipantCount,
  type PollInsightRow,
  type PollInsightsData,
  type PollQuestionInsights,
} from '@/lib/poll-insights';

const TASK_PUBLICATION_SELECT =
  'id, title, is_published, target_number_of_participants, deadline, review_status, is_active';

const PUBLISHED_POLL_TASK_SELECT =
  'id, title, is_published, target_number_of_participants, deadline, review_status, is_active, pax_task_id, created_at' as const;

type TaskPublicationRow = {
  id: string;
  title: string;
  is_published: boolean;
  target_number_of_participants: number | null;
  deadline: string | null;
  review_status: string;
  is_active: boolean;
};

type PublishedPollTaskRow = TaskPublicationRow & {
  pax_task_id: string;
  created_at: string;
};

function mapTaskPublicationFields(task: TaskPublicationRow) {
  return {
    isPublished: task.is_published,
    deadline: task.deadline,
    reviewStatus: task.review_status,
    isActive: task.is_active,
  };
}

export type PublishedPollSummary = {
  taskId: string;
  taskTitle: string;
  questionText: string;
  questionCount: number;
  responseCount: number;
  targetParticipants: number | null;
  isPublished: boolean;
  deadline: string | null;
  reviewStatus: string;
  isActive: boolean;
};

export async function fetchPollInsightsByPaxTaskId(
  paxTaskId: string,
): Promise<PollInsightsData | null> {
  const supabase = getSupabaseAdmin();

  const { data: insightsTask, error: taskError } = await supabase
    .from('tasks')
    .select(TASK_PUBLICATION_SELECT)
    .eq('pax_task_id', paxTaskId)
    .single();

  if (taskError || !insightsTask) {
    return null;
  }

  const { data: questions, error: questionError } = await supabase
    .from('questions')
    .select('id, question_text, sort_order')
    .eq('task_id', insightsTask.id)
    .order('sort_order', { ascending: true });

  if (questionError || !questions?.length) {
    return null;
  }

  const questionIds = questions.map((q) => q.id);

  const [optionsResult, answersResult] = await Promise.all([
    supabase
      .from('question_options')
      .select('id, question_id, option_text, sort_order')
      .in('question_id', questionIds)
      .order('sort_order', { ascending: true }),
    supabase
      .from('answers')
      .select('id, task_id, pax_task_id, question_id, question_option_id, participant_id, created_at')
      .eq('pax_task_id', paxTaskId),
  ]);

  const { data: options, error: optionsError } = optionsResult;
  const { data: answers, error: answersError } = answersResult;

  if (optionsError) {
    throw new Error(optionsError.message);
  }

  if (answersError) {
    throw new Error(answersError.message);
  }

  const optionsByQuestionId = new Map<string, typeof options>();
  for (const option of options ?? []) {
    const list = optionsByQuestionId.get(option.question_id) ?? [];
    list.push(option);
    optionsByQuestionId.set(option.question_id, list);
  }

  const participantIds = Array.from(new Set((answers ?? []).map((answer) => answer.participant_id)));
  let participantsById = new Map<
    string,
    { gender: string | null; country: string | null; date_of_birth: string | null }
  >();

  if (participantIds.length > 0) {
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('id, gender, country, date_of_birth')
      .in('id', participantIds);

    if (participantsError) {
      throw new Error(participantsError.message);
    }

    participantsById = new Map(
      (participants ?? []).map((participant) => [
        participant.id,
        {
          gender: participant.gender,
          country: participant.country,
          date_of_birth: participant.date_of_birth,
        },
      ]),
    );
  }

  const rowsByQuestionId = new Map<string, PollInsightRow[]>();
  for (const answer of answers ?? []) {
    const participant = participantsById.get(answer.participant_id);
    const row: PollInsightRow = {
      answer_id: answer.id,
      task_id: answer.task_id,
      pax_task_id: answer.pax_task_id,
      question_id: answer.question_id,
      question_option_id: answer.question_option_id,
      participant_id: answer.participant_id,
      answered_at: answer.created_at,
      gender: participant?.gender ?? null,
      country: participant?.country ?? null,
      age: calculateAgeFromDateOfBirth(participant?.date_of_birth ?? null),
    };
    const list = rowsByQuestionId.get(answer.question_id) ?? [];
    list.push(row);
    rowsByQuestionId.set(answer.question_id, list);
  }

  const questionInsights: PollQuestionInsights[] = questions.map((question) => ({
    questionId: question.id,
    questionText: question.question_text,
    sortOrder: question.sort_order,
    options: optionsByQuestionId.get(question.id) ?? [],
    rows: rowsByQuestionId.get(question.id) ?? [],
  }));

  return {
    taskTitle: insightsTask.title,
    questions: questionInsights,
    targetParticipants: insightsTask.target_number_of_participants,
    ...mapTaskPublicationFields(insightsTask),
  };
}

export async function fetchAllPublishedPollSummaries(): Promise<PublishedPollSummary[]> {
  const supabase = getSupabaseAdmin();

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select(PUBLISHED_POLL_TASK_SELECT)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (tasksError) {
    throw new Error(tasksError.message);
  }

  if (!tasks?.length) {
    return [];
  }

  const taskIds = tasks.map((task) => task.id);
  const paxTaskIds = tasks.map((task) => task.pax_task_id);

  const [questionsResult, answersResult] = await Promise.all([
    supabase
      .from('questions')
      .select('id, task_id, question_text, sort_order')
      .in('task_id', taskIds)
      .order('sort_order', { ascending: true }),
    supabase
      .from('answers')
      .select('pax_task_id, participant_id, question_id')
      .in('pax_task_id', paxTaskIds),
  ]);

  const { data: questions, error: questionsError } = questionsResult;
  const { data: answers, error: answersError } = answersResult;

  if (questionsError) {
    throw new Error(questionsError.message);
  }

  if (answersError) {
    throw new Error(answersError.message);
  }

  const questionsByTaskId = new Map<string, typeof questions>();
  for (const question of questions ?? []) {
    const list = questionsByTaskId.get(question.task_id) ?? [];
    list.push(question);
    questionsByTaskId.set(question.task_id, list);
  }

  const answersByPaxTaskId = new Map<string, typeof answers>();
  for (const answer of answers ?? []) {
    if (!answer.pax_task_id) continue;
    const list = answersByPaxTaskId.get(answer.pax_task_id) ?? [];
    list.push(answer);
    answersByPaxTaskId.set(answer.pax_task_id, list);
  }

  return tasks
    .map((task) => {
      const taskQuestions = questionsByTaskId.get(task.id) ?? [];
      if (!taskQuestions.length) return null;

      const taskAnswers = answersByPaxTaskId.get(task.pax_task_id) ?? [];
      const requiredCount = taskQuestions.length;
      const countsByParticipant = new Map<string, number>();
      for (const answer of taskAnswers) {
        countsByParticipant.set(
          answer.participant_id,
          (countsByParticipant.get(answer.participant_id) ?? 0) + 1,
        );
      }
      const responseCount = Array.from(countsByParticipant.values()).filter(
        (c) => c >= requiredCount,
      ).length;

      return {
        taskId: task.pax_task_id,
        taskTitle: task.title,
        questionText: taskQuestions[0].question_text,
        questionCount: taskQuestions.length,
        responseCount,
        targetParticipants: task.target_number_of_participants,
        ...mapTaskPublicationFields(task),
      };
    })
    .filter((poll): poll is PublishedPollSummary => poll !== null);
}

export { completedParticipantCount };
