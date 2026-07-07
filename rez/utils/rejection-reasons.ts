export interface RejectionReason {
  id: number;
  label: string;
  appliesTo: ('fillAForm' | 'checkOutApp' | 'both')[];
}

export const SPAM_CONTENT_REJECTION_REASON_ID = 9;

export const REJECTION_REASONS: RejectionReason[] = [
  {
    id: 1,
    label: 'Title content is too long',
    appliesTo: ['both'],
  },
  {
    id: 2,
    label: 'Title content is inappropriate',
    appliesTo: ['both'],
  },
  {
    id: 3,
    label: 'Number of questions / feedback questions does not match the given entry',
    appliesTo: ['both'],
  },
  {
    id: 4,
    label: 'Link to survey form lacks appropriate redirect url "thepaxtask://"',
    appliesTo: ['fillAForm'],
  },
  {
    id: 5,
    label: 'Instructions are unclear',
    appliesTo: ['checkOutApp'],
  },
  {
    id: 6,
    label: 'Instructions are too long',
    appliesTo: ['checkOutApp'],
  },
  {
    id: 7,
    label: 'Instructions are inappropriate',
    appliesTo: ['checkOutApp'],
  },
  {
    id: 8,
    label: 'Feedback from questions need to edited / improved',
    appliesTo: ['both'],
  },
  {
    id: SPAM_CONTENT_REJECTION_REASON_ID,
    label: 'Spam content',
    appliesTo: ['both'],
  },
];

/**
 * Get rejection reason label by ID
 */
export function getRejectionReasonLabel(id: number): string {
  const reason = REJECTION_REASONS.find((r) => r.id === id);
  return reason?.label || `Unknown reason (${id})`;
}

/**
 * Get rejection reasons that apply to a specific task type
 */
export function getRejectionReasonsForTaskType(
  taskType: 'fillAForm' | 'checkOutApp' | string | null
): RejectionReason[] {
  if (!taskType) return REJECTION_REASONS;
  
  return REJECTION_REASONS.filter((reason) => {
    if (reason.appliesTo.includes('both')) return true;
    if (taskType === 'fillAForm' && reason.appliesTo.includes('fillAForm')) return true;
    if (taskType === 'checkOutApp' && reason.appliesTo.includes('checkOutApp')) return true;
    return false;
  });
}

/**
 * Format rejection reasons array into readable string
 */
export function formatRejectionReasons(reasons: number[]): string {
  return reasons.map(getRejectionReasonLabel).join(', ');
}
