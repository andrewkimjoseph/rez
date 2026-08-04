import { describe, expect, it } from 'vitest';
import { formatAdminTimestamp } from './format-admin-timestamp';

describe('formatAdminTimestamp', () => {
  it('formats Firestore seconds timestamps', () => {
    const formatted = formatAdminTimestamp({ seconds: 1784246400 });
    expect(formatted).not.toBe('N/A');
    expect(formatted).toContain('2026');
  });

  it('formats Firestore _seconds timestamps', () => {
    const formatted = formatAdminTimestamp({ _seconds: 1784246400 });
    expect(formatted).not.toBe('N/A');
    expect(formatted).toContain('2026');
  });

  it('formats ISO strings from Algolia', () => {
    const formatted = formatAdminTimestamp('2026-07-16T12:00:00.000Z');
    expect(formatted).not.toBe('N/A');
    expect(formatted).toContain('2026');
  });

  it('returns fallback for missing values', () => {
    expect(formatAdminTimestamp(null)).toBe('N/A');
    expect(formatAdminTimestamp(undefined)).toBe('N/A');
  });
});
