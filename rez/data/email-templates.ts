/**
 * Resend email template IDs.
 * Used by /api/sendResendEmail to send transactional emails.
 */
export const EMAIL_TEMPLATES = {
  taskCreated: 'd24dcde1-e155-40f3-9ab5-6377cf878e20',
  taskRejected: '7aea42e0-e714-407e-809e-bbe323c88d16',
  taskApproved: '28a64ff9-3dd5-4af9-9d45-2ef3976302bb',
  taskPublished: 'ffda9f53-e424-49e5-9b6f-cdee85545d4c',
  taskActivated: '7465a80a-83cd-413f-b48a-45d2ab682430',
  taskCompleted: '967b5e39-248b-495f-9d79-3b356b5e18e5',
} as const;

export type EmailTemplateType = keyof typeof EMAIL_TEMPLATES;
