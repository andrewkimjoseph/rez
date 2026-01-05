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
} 