export interface TaskCompletion {
  id: string | null;
  taskId: string | null;
  participantId: string | null;
  screeningId: string | null;
  timeCreated: any | null; // Firestore Timestamp
  timeUpdated: any | null; // Firestore Timestamp
  timeCompleted: any | null; // Firestore Timestamp
} 