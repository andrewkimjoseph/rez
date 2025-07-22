import { Timestamp } from 'firebase/firestore';

export interface Organization {
  id: string;
  taskMasterId: string | null;
  name: string | null;
  country: string | null;
  teamSize: string | null;
  timeCreated: Timestamp | null;
  timeUpdated: Timestamp | null;
} 