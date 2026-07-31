import { describe, expect, it } from 'vitest';
import { toCsv, type PollInsightsData } from './poll-insights';

function buildFixture(): PollInsightsData {
  return {
    taskTitle: 'Sample Poll',
    targetParticipants: 100,
    isPublished: true,
    deadline: null,
    reviewStatus: 'published',
    isActive: true,
    questions: [
      {
        questionId: 'q1',
        questionText: 'What is your favorite color?',
        sortOrder: 0,
        options: [
          { id: 'opt-a', option_text: 'Red', sort_order: 0 },
          { id: 'opt-b', option_text: 'Blue', sort_order: 1 },
        ],
        rows: [
          {
            answer_id: 'a1',
            task_id: 't1',
            pax_task_id: 'pax1',
            question_id: 'q1',
            question_option_id: 'opt-a',
            participant_id: 'participant-b',
            answered_at: '2026-01-02T10:00:00.000Z',
            gender: 'Female',
            country: 'Kenya',
            age: 22,
          },
          {
            answer_id: 'a2',
            task_id: 't1',
            pax_task_id: 'pax1',
            question_id: 'q1',
            question_option_id: 'opt-b',
            participant_id: 'participant-a',
            answered_at: '2026-01-01T10:00:00.000Z',
            gender: 'Male',
            country: 'Uganda',
            age: 30,
          },
        ],
      },
      {
        questionId: 'q2',
        questionText: 'Do you agree with "yes, and"?',
        sortOrder: 1,
        options: [
          { id: 'opt-yes', option_text: 'Yes', sort_order: 0 },
          { id: 'opt-no', option_text: 'No', sort_order: 1 },
        ],
        rows: [
          {
            answer_id: 'a3',
            task_id: 't1',
            pax_task_id: 'pax1',
            question_id: 'q2',
            question_option_id: 'opt-yes',
            participant_id: 'participant-a',
            answered_at: '2026-01-01T10:01:00.000Z',
            gender: 'Male',
            country: 'Uganda',
            age: 30,
          },
          {
            answer_id: 'a4',
            task_id: 't1',
            pax_task_id: 'pax1',
            question_id: 'q2',
            question_option_id: 'opt-no',
            participant_id: 'participant-b',
            answered_at: '2026-01-02T10:01:00.000Z',
            gender: 'Female',
            country: 'Kenya',
            age: 22,
          },
        ],
      },
    ],
  };
}

describe('toCsv', () => {
  it('exports one row per answer with the expected header', () => {
    const csv = toCsv(buildFixture());
    const lines = csv.split('\n');

    expect(lines[0]).toBe(
      'participant_id,question_number,question_text,selected_option,answered_at,gender,country,age,age_bucket',
    );
    expect(lines).toHaveLength(5);
  });

  it('resolves question and option text and sorts by participant then question order', () => {
    const csv = toCsv(buildFixture());
    const lines = csv.split('\n').slice(1);

    expect(lines[0]).toContain('"participant-a"');
    expect(lines[0]).toContain('"What is your favorite color?"');
    expect(lines[0]).toContain('"Blue"');
    expect(lines[0]).toContain('"Male"');
    expect(lines[0]).toContain('"Uganda"');
    expect(lines[0]).toContain('30');
    expect(lines[0]).toContain('"25-34"');

    expect(lines[1]).toContain('"participant-a"');
    expect(lines[1]).toContain('"Do you agree with \\"yes, and\\"?"');
    expect(lines[1]).toContain('"Yes"');

    expect(lines[2]).toContain('"participant-b"');
    expect(lines[2]).toContain('"Red"');

    expect(lines[3]).toContain('"participant-b"');
    expect(lines[3]).toContain('"No"');
  });

  it('escapes commas and quotes in question text', () => {
    const data = buildFixture();
    data.questions[1].questionText = 'Pick one: A, B, or "C"';

    const csv = toCsv(data);

    expect(csv).toContain('"Pick one: A, B, or \\"C\\""');
  });

  it('does not include PII fields in the export', () => {
    const csv = toCsv(buildFixture());

    expect(csv).not.toContain('email');
    expect(csv).not.toContain('display_name');
    expect(csv).not.toContain('date_of_birth');
    expect(csv).not.toContain('displayName');
  });
});
