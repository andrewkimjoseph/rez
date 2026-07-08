import { getSupabaseAdmin } from '@/lib/supabase/server';
import {
  calculateAgeFromDateOfBirth,
  type PollInsightRow,
  type PollInsightsData,
  type PollOptionMeta,
  type PollQuestionInsights,
} from '@/lib/poll-insights';

const TASK_PUBLICATION_SELECT =
  'id, title, is_published, target_number_of_participants, deadline, review_status, is_active';

const PUBLISHED_POLL_TASK_SELECT =
  'id, title, is_published, target_number_of_participants, deadline, review_status, is_active, pax_task_id, created_at' as const;

const SUPABASE_PAGE_SIZE = 1000;

type AnswerParticipantRow = {
  participant_id: string | null;
};

type AnswerSummaryRow = AnswerParticipantRow & {
  question_id: string;
  question_option_id: string;
};

type AnswerDemographicsRow = AnswerParticipantRow & {
  id: string;
  task_id: string;
  pax_task_id: string;
  question_id: string;
  question_option_id: string;
  created_at: string;
};

type AnswerListCountRow = AnswerParticipantRow & {
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

function countUniqueParticipants(
  answers: Array<{ participant_id: string | null }>,
): number {
  return new Set(
    answers
      .map((answer) => answer.participant_id)
      .filter((participantId): participantId is string => typeof participantId === 'string' && participantId.length > 0),
  ).size;
}

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

export type PollInsightsSummaryData = {
  taskTitle: string;
  questions: PollQuestionInsights[];
  targetParticipants: number | null;
  responseCount: number;
  isPublished: boolean;
  deadline: string | null;
  reviewStatus: string;
  isActive: boolean;
};

export type PollInsightsDemographicsData = {
  rows: PollInsightRow[];
};

export async function fetchPollInsightsSummaryByPaxTaskId(
  paxTaskId: string,
): Promise<PollInsightsSummaryData | null> {
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

  const [optionsResult, answers] = await Promise.all([
    supabase
      .from('question_options')
      .select('id, question_id, option_text, sort_order')
      .in('question_id', questionIds)
      .order('sort_order', { ascending: true }),
    fetchPaginatedRows<AnswerSummaryRow>(async (from, to) =>
      supabase
        .from('answers')
        .select('question_id, question_option_id, participant_id')
        .eq('pax_task_id', paxTaskId)
        .order('id', { ascending: true })
        .range(from, to),
    ),
  ]);

  const { data: options, error: optionsError } = optionsResult;

  if (optionsError) {
    throw new Error(optionsError.message);
  }

  const optionsByQuestionId = new Map<string, PollOptionMeta[]>();
  for (const option of options ?? []) {
    const list = optionsByQuestionId.get(option.question_id) ?? [];
    list.push(option);
    optionsByQuestionId.set(option.question_id, list);
  }

  const rowsByQuestionId = new Map<string, PollInsightRow[]>();
  for (const answer of answers) {
    const row: PollInsightRow = {
      answer_id: null,
      task_id: null,
      pax_task_id: paxTaskId,
      question_id: answer.question_id,
      question_option_id: answer.question_option_id,
      participant_id: answer.participant_id,
      answered_at: null,
      gender: null,
      country: null,
      age: null,
    };
    const list = rowsByQuestionId.get(answer.question_id) ?? [];
    list.push(row);
    rowsByQuestionId.set(answer.question_id, list);
  }

  const responseCount = countUniqueParticipants(answers);

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
    responseCount,
    ...mapTaskPublicationFields(insightsTask),
  };
}

export async function fetchPollInsightsDemographicsByPaxTaskId(
  paxTaskId: string,
): Promise<PollInsightsDemographicsData> {
  const supabase = getSupabaseAdmin();

  const answers = await fetchPaginatedRows<AnswerDemographicsRow>(async (from, to) =>
    supabase
      .from('answers')
      .select('id, task_id, pax_task_id, question_id, question_option_id, participant_id, created_at')
      .eq('pax_task_id', paxTaskId)
      .order('id', { ascending: true })
      .range(from, to),
  );

  const participantIds = Array.from(
    new Set(
      answers
        .map((answer) => answer.participant_id)
        .filter((participantId): participantId is string => typeof participantId === 'string' && participantId.length > 0),
    ),
  );

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

  const rows: PollInsightRow[] = answers.map((answer) => {
    const participant = answer.participant_id
      ? participantsById.get(answer.participant_id)
      : undefined;
    return {
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
  });

  return { rows };
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

  const [questionsResult, answers] = await Promise.all([
    supabase
      .from('questions')
      .select('id, task_id, question_text, sort_order')
      .in('task_id', taskIds)
      .order('sort_order', { ascending: true }),
    fetchPaginatedRows<AnswerListCountRow>(async (from, to) =>
      supabase
        .from('answers')
        .select('pax_task_id, participant_id')
        .in('pax_task_id', paxTaskIds)
        .order('id', { ascending: true })
        .range(from, to),
    ),
  ]);

  const { data: questions, error: questionsError } = questionsResult;

  if (questionsError) {
    throw new Error(questionsError.message);
  }

  const questionsByTaskId = new Map<string, typeof questions>();
  for (const question of questions ?? []) {
    const list = questionsByTaskId.get(question.task_id) ?? [];
    list.push(question);
    questionsByTaskId.set(question.task_id, list);
  }

  const answersByPaxTaskId = new Map<string, AnswerListCountRow[]>();
  for (const answer of answers) {
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
      const responseCount = countUniqueParticipants(taskAnswers);

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

export function mergeSummaryAndDemographics(
  summary: PollInsightsSummaryData,
  demographics: PollInsightsDemographicsData | null,
): PollInsightsData {
  if (!demographics) {
    return {
      taskTitle: summary.taskTitle,
      questions: summary.questions,
      targetParticipants: summary.targetParticipants,
      isPublished: summary.isPublished,
      deadline: summary.deadline,
      reviewStatus: summary.reviewStatus,
      isActive: summary.isActive,
    };
  }

  const rowsByQuestionId = new Map<string, PollInsightRow[]>();
  for (const row of demographics.rows) {
    if (!row.question_id) continue;
    const list = rowsByQuestionId.get(row.question_id) ?? [];
    list.push(row);
    rowsByQuestionId.set(row.question_id, list);
  }

  return {
    taskTitle: summary.taskTitle,
    questions: summary.questions.map((question) => ({
      ...question,
      rows: rowsByQuestionId.get(question.questionId) ?? [],
    })),
    targetParticipants: summary.targetParticipants,
    isPublished: summary.isPublished,
    deadline: summary.deadline,
    reviewStatus: summary.reviewStatus,
    isActive: summary.isActive,
  };
}
