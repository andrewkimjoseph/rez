export interface Task {
  id: string | null;
  taskMasterId: string | null;
  title: string | null;
  type: string | null;
  category: string | null;
  estimatedTimeOfCompletionInMinutes: number | null;
  targetNumberOfParticipants: number | null;
  link: string | null;
  levelOfDifficulty: string | null;
  deadline: number | null;
  managerContractAddress: string | null;
  rewardAmountPerParticipant: number | null;
  rewardCurrencyId: string | null;
  isAvailable: boolean | null;
  timeCreated: any | null; // Firestore Timestamp
  timeUpdated: any | null; // Firestore Timestamp
  isTest: boolean | null;
  rezTaskMasterEmailAddress: string | null;
} 