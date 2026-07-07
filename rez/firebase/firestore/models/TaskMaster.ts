import { Timestamp } from 'firebase/firestore';

export interface TaskMaster {
  id: string;
  name: string | null;
  emailAddress: string | null;
  profilePictureURI: string | null;
  organizationId: string | null;
  privyDid: string | null;
  timeCreated: Timestamp | null;
  timeUpdated: Timestamp | null;
  isSuperAdmin?: boolean;
  taskCreationBlocked?: boolean;
  taskCreationBlockReason?: string | null;
  taskCreationBlockedAt?: Timestamp | null;
} 