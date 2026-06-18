export type PollQuestionDraft = {
  questionText: string;
  options: string[];
};

export const MAX_POLL_QUESTIONS = 10;
export const MIN_POLL_OPTIONS = 2;

export function validatePollQuestions(questions: PollQuestionDraft[] | undefined): string | null {
  if (!questions?.length) {
    return 'At least one poll question is required';
  }
  if (questions.length > MAX_POLL_QUESTIONS) {
    return `Polls can have at most ${MAX_POLL_QUESTIONS} questions`;
  }
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.questionText?.trim()) {
      return `Question ${i + 1} text is required`;
    }
    const options = q.options.map((o) => o.trim()).filter(Boolean);
    if (options.length < MIN_POLL_OPTIONS) {
      return `Question ${i + 1} must have at least ${MIN_POLL_OPTIONS} options`;
    }
  }
  return null;
}

export function normalizePollQuestions(questions: PollQuestionDraft[]): PollQuestionDraft[] {
  return questions.map((q) => ({
    questionText: q.questionText.trim(),
    options: q.options.map((o) => o.trim()).filter(Boolean),
  }));
}
