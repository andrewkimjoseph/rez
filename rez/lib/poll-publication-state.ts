export type InsightsCollectionStatus = 'live' | 'ended' | null;

/** Mirrors Supabase/Firestore review workflow — independent of deadline and is_active. */
export function isPollPublished(reviewStatus: string | null): boolean {
  return reviewStatus === 'published';
}

export function isPollInactiveReviewStatus(reviewStatus: string | null): boolean {
  return reviewStatus === 'archived' || reviewStatus === 'rejected';
}

/** Polls whose results may appear on public Insights surfaces. */
export function isPollPubliclyVisible(reviewStatus: string | null): boolean {
  return reviewStatus === 'published' || reviewStatus === 'archived';
}

/** Whether Pax is actively collecting responses right now. */
export function isPollActiveOnPax(input: {
  isActive: boolean | null;
  deadline: string | null;
  now?: Date;
}): boolean {
  if (input.isActive !== true) return false;
  if (input.deadline && new Date(input.deadline) <= (input.now ?? new Date())) return false;
  return true;
}

export function getInsightsCollectionStatus(
  isActive: boolean,
  deadline: string | null,
  now?: Date,
): InsightsCollectionStatus {
  const reference = now ?? new Date();
  const pastDeadline = deadline ? new Date(deadline) <= reference : false;
  if (pastDeadline) return 'ended';
  if (isActive) return 'live';
  return null;
}

export function coerceFirestoreDeadline(
  deadline: { toDate?: () => Date; seconds?: number; _seconds?: number } | Date | string | null | undefined,
): string | null {
  if (deadline == null) return null;
  if (deadline instanceof Date) return deadline.toISOString();
  if (typeof deadline === 'string') return deadline;
  if (typeof deadline.toDate === 'function') return deadline.toDate().toISOString();
  const seconds = deadline.seconds ?? deadline._seconds;
  if (typeof seconds === 'number') return new Date(seconds * 1000).toISOString();
  return null;
}
