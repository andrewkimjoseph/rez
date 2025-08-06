import { Timestamp } from "firebase/firestore";

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
  deadline: Timestamp | null;
  managerContractAddress: string | null;
  rewardAmountPerParticipant: number | null;
  rewardCurrencyId: number | null;
  isAvailable: boolean | null;
  timeCreated: Timestamp | null;  
  timeUpdated: Timestamp | null;
  isTest: boolean | null;
  rezTaskMasterEmailAddress: string | null;
} 