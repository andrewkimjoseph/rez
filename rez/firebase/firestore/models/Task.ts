import { Timestamp } from "firebase/firestore";

export interface Task {
  id: string | null;
  taskMasterId: string | null;
  title: string | null;
  type: 'fillAForm' | 'checkOutApp' | 'doVideoInterview' | string | null;
  category: string | null;
  estimatedTimeOfCompletionInMinutes: number | null;
  deadline: Timestamp | null;
  targetNumberOfParticipants: number | null;
  link: string | null;
  levelOfDifficulty: string | null;
  managerContractAddress: string | null;
  rewardAmountPerParticipant: number | null;
  rewardCurrencyId: number | null;
  isAvailable: boolean | null;
  timeCreated: Timestamp | null;  
  timeUpdated: Timestamp | null;
  isTest: boolean | null;
  feedback: string | null;
  paymentTerms: string | null;
  instructions: string | null;
  targetCountry: string | null;
  numberOfCooldownHours: number | null;
  rezTaskMasterEmailAddress: string | null;
} 