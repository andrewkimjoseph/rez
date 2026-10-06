import { Timestamp } from 'fires2rest';
import { describe, expect, it } from 'vitest';
import { cursorValues, reviveTimestamps } from './firestore-client';

describe('firestore client timestamps', () => {
  it('turns Date values into Firestore timestamps with seconds', () => {
    const revived = reviveTimestamps({
      timeCreated: new Date('2026-07-16T12:00:00.000Z'),
      nested: { deadline: new Date('2026-07-17T00:00:00.000Z') },
      title: 'Poll',
    }) as {
      timeCreated: Timestamp;
      nested: { deadline: Timestamp };
      title: string;
    };

    expect(revived.timeCreated).toBeInstanceOf(Timestamp);
    expect(revived.timeCreated.toDate().toISOString()).toBe('2026-07-16T12:00:00.000Z');
    expect(JSON.parse(JSON.stringify(revived.timeCreated)).seconds).toBe(
      Math.floor(new Date('2026-07-16T12:00:00.000Z').getTime() / 1000),
    );
    expect(revived.nested.deadline.toDate().toISOString()).toBe('2026-07-17T00:00:00.000Z');
    expect(revived.title).toBe('Poll');
  });

  it('uses orderBy field values when paging after a document', () => {
    const timeCreated = Timestamp.fromDate(new Date('2026-07-16T12:00:00.000Z'));
    const values = cursorValues(
      { _constraints: { orderBy: [{ field: { fieldPath: 'timeCreated' } }] } },
      {
        id: 'task-1',
        data: () => ({ timeCreated }),
      },
    );

    expect(values).toEqual([timeCreated]);
  });
});