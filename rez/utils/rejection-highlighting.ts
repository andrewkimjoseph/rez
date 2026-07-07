/**
 * Maps rejection reason IDs to field names that should be highlighted
 */

export function getRejectedFields(
  reasons: number[],
  taskType: 'fillAForm' | 'checkOutApp' | string | null
): string[] {
  const fields: string[] = [];

  reasons.forEach((reasonId) => {
    switch (reasonId) {
      case 1:
      case 2:
        // Title content issues
        if (!fields.includes('title')) {
          fields.push('title');
        }
        break;
      case 3:
        // Questions/feedback questions mismatch
        if (taskType === 'fillAForm') {
          if (!fields.includes('numberOfQuestions')) {
            fields.push('numberOfQuestions');
          }
        } else if (taskType === 'checkOutApp') {
          if (!fields.includes('numberOfFeedbackQuestions')) {
            fields.push('numberOfFeedbackQuestions');
          }
        }
        break;
      case 4:
        // Link missing redirect (only for online surveys)
        if (taskType === 'fillAForm') {
          if (!fields.includes('link')) {
            fields.push('link');
          }
        }
        break;
      case 5:
      case 6:
      case 7:
        // Instructions issues (only for product testing)
        if (taskType === 'checkOutApp') {
          if (!fields.includes('instructions')) {
            fields.push('instructions');
          }
        }
        break;
      case 8:
        // Feedback questions need improvement
        if (!fields.includes('feedback')) {
          fields.push('feedback');
        }
        break;
      case 9:
        // Spam content is account-level, not tied to specific form fields
        break;
    }
  });

  return fields;
}

/**
 * Check if a specific field is rejected
 */
export function isFieldRejected(
  fieldName: string,
  reasons: number[] | undefined,
  taskType: 'fillAForm' | 'checkOutApp' | string | null
): boolean {
  if (!reasons || reasons.length === 0) return false;
  const rejectedFields = getRejectedFields(reasons, taskType);
  return rejectedFields.includes(fieldName);
}

/**
 * Get rejection reason labels for a specific field
 */
export function getRejectionReasonsForField(
  fieldName: string,
  reasons: number[] | undefined,
  taskType: 'fillAForm' | 'checkOutApp' | string | null
): number[] {
  if (!reasons || reasons.length === 0) return [];

  const fieldReasons: number[] = [];

  reasons.forEach((reasonId) => {
    switch (reasonId) {
      case 1:
      case 2:
        if (fieldName === 'title') {
          fieldReasons.push(reasonId);
        }
        break;
      case 3:
        if (
          (taskType === 'fillAForm' && fieldName === 'numberOfQuestions') ||
          (taskType === 'checkOutApp' && fieldName === 'numberOfFeedbackQuestions')
        ) {
          fieldReasons.push(reasonId);
        }
        break;
      case 4:
        if (taskType === 'fillAForm' && fieldName === 'link') {
          fieldReasons.push(reasonId);
        }
        break;
      case 5:
      case 6:
      case 7:
        if (taskType === 'checkOutApp' && fieldName === 'instructions') {
          fieldReasons.push(reasonId);
        }
        break;
      case 8:
        if (fieldName === 'feedback') {
          fieldReasons.push(reasonId);
        }
        break;
      case 9:
        // Spam content is account-level, not tied to specific form fields
        break;
    }
  });

  return fieldReasons;
}
