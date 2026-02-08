export interface TaskCompletion {
  id: string | null;
  isValid: boolean;
  participantId: string | null;
  /** Enriched by API from PaxDB participants collection; not stored in Firestore. */
  participantEmailAddress?: string | null;
  screeningId: string | null;
  taskId: string | null;
  timeCompleted: any | null; // Firestore Timestamp
  timeCreated: any | null; // Firestore Timestamp
  timeUpdated: any | null; // Firestore Timestamp
} 