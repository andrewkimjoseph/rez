/**
 * Format Firestore or Algolia timestamp values for admin tables.
 */
export function formatAdminTimestamp(timestamp: unknown, fallback = 'N/A'): string {
  if (!timestamp) return fallback;

  try {
    let date: Date;
    const ts = timestamp as Record<string, unknown>;

    if (typeof ts.seconds === 'number') {
      date = new Date(ts.seconds * 1000);
    } else if (typeof ts._seconds === 'number') {
      date = new Date(ts._seconds * 1000);
    } else if (typeof ts.toDate === 'function') {
      date = (ts.toDate as () => Date)();
    } else {
      date = new Date(timestamp as string | number);
    }

    if (Number.isNaN(date.getTime())) return fallback;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  } catch {
    return fallback;
  }
}
