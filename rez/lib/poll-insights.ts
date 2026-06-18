export type PollInsightRow = {
  answer_id: string | null;
  task_id: string | null;
  pax_task_id: string | null;
  question_id: string | null;
  question_option_id: string | null;
  participant_id: string | null;
  answered_at: string | null;
  gender: string | null;
  country: string | null;
  age: number | null;
};

export type PollOptionMeta = {
  id: string;
  option_text: string;
  sort_order: number;
};

export type PollQuestionInsights = {
  questionId: string;
  questionText: string;
  sortOrder: number;
  options: PollOptionMeta[];
  rows: PollInsightRow[];
};

export type PollInsightsData = {
  taskTitle: string;
  questions: PollQuestionInsights[];
  targetParticipants: number | null;
  isPublished: boolean;
  deadline: string | null;
  reviewStatus: string;
  isActive: boolean;
};

/** All insight rows across questions (for demographics). */
export function allInsightRows(data: PollInsightsData): PollInsightRow[] {
  return data.questions.flatMap((q) => q.rows);
}

/** Participants who answered every question in the poll. */
export function completedParticipantCount(data: PollInsightsData): number {
  if (data.questions.length === 0) return 0;
  const required = data.questions.length;
  const counts = new Map<string, number>();
  for (const question of data.questions) {
    for (const row of question.rows) {
      if (!row.participant_id) continue;
      counts.set(row.participant_id, (counts.get(row.participant_id) ?? 0) + 1);
    }
  }
  return Array.from(counts.values()).filter((c) => c >= required).length;
}

export type ChartDatum = {
  label: string;
  value: number;
};

export type ChartDatumWithPct = ChartDatum & {
  pct: number;
};

export const AGE_BUCKET_ORDER = [
  'Under 18',
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55+',
  'Unknown',
] as const;

export function withPercentages(data: ChartDatum[]): ChartDatumWithPct[] {
  const total = data.reduce((sum, row) => sum + row.value, 0);
  return data.map((row) => ({
    ...row,
    pct: total > 0 ? Math.round((row.value / total) * 100) : 0,
  }));
}

export function capCountryBuckets(data: ChartDatum[], limit = 8): ChartDatum[] {
  if (data.length <= limit) {
    return [...data].sort((a, b) => b.value - a.value);
  }

  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  const otherCount = rest.reduce((sum, row) => sum + row.value, 0);

  if (otherCount > 0) {
    top.push({ label: 'Other', value: otherCount });
  }

  return top;
}

export function orderAgeBuckets(data: ChartDatum[]): ChartDatum[] {
  const byLabel = new Map(data.map((row) => [row.label, row.value]));
  return AGE_BUCKET_ORDER.filter((label) => byLabel.has(label)).map((label) => ({
    label,
    value: byLabel.get(label) ?? 0,
  }));
}

export function calculateAgeFromDateOfBirth(dob: string | null): number | null {
  if (!dob) return null;
  const birthDate = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

export function ageBucket(age: number | null): string {
  if (age == null) return 'Unknown';
  if (age < 18) return 'Under 18';
  if (age <= 24) return '18-24';
  if (age <= 34) return '25-34';
  if (age <= 44) return '35-44';
  if (age <= 54) return '45-54';
  return '55+';
}

export function aggregateCounts(
  rows: PollInsightRow[],
  pick: (row: PollInsightRow) => string,
): ChartDatum[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = pick(row) || 'Unknown';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function aggregatePollResults(
  rows: PollInsightRow[],
  options: PollOptionMeta[],
): ChartDatum[] {
  const counts = new Map(options.map((option) => [option.id, 0]));
  for (const row of rows) {
    if (!row.question_option_id) continue;
    counts.set(row.question_option_id, (counts.get(row.question_option_id) ?? 0) + 1);
  }

  return options.map((option) => ({
    label: option.option_text,
    value: counts.get(option.id) ?? 0,
  }));
}

export function toCsv(
  data: PollInsightsData,
  genderData: ChartDatum[],
  countryData: ChartDatum[],
  ageData: ChartDatum[],
): string {
  const lines = [
    'Poll Insights Export',
    `Title,${JSON.stringify(data.taskTitle)}`,
    `Total completed responses,${completedParticipantCount(data)}`,
    '',
  ];

  for (const question of data.questions) {
    const pollResults = aggregatePollResults(question.rows, question.options);
    lines.push(`Question,${JSON.stringify(question.questionText)}`);
    lines.push('Option,Count');
    lines.push(...pollResults.map((row) => `${JSON.stringify(row.label)},${row.value}`));
    lines.push('');
  }

  lines.push(
    'Gender',
    'Gender,Count',
    ...genderData.map((row) => `${JSON.stringify(row.label)},${row.value}`),
    '',
    'Country',
    'Country,Count',
    ...countryData.map((row) => `${JSON.stringify(row.label)},${row.value}`),
    '',
    'Age',
    'Age bucket,Count',
    ...ageData.map((row) => `${JSON.stringify(row.label)},${row.value}`),
  );

  return lines.join('\n');
}
