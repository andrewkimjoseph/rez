export interface Reward {
  id: string | null;
  isPaidOutToPaxAccount: boolean;
  nonce: string | null;
  participantId: string | null;
  rewardCurrencyId: number | null;
  signature: string | null;
  taskCompletionId: string | null;
  taskId: string | null;
  timeCreated: any | null; // Firestore Timestamp
  timePaidOut: any | null; // Firestore Timestamp
  timeUpdated: any | null; // Firestore Timestamp
  txnHash: string | null;
}
