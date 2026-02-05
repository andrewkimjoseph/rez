import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Organization } from '../models/Organization';
import { firestore } from '../../clientConfig';
import { COLLECTIONS } from '../constants/collections';

export async function createOrganizationInFirestore({
  taskMasterId,
  name,
  country,
  teamSize,
}: {
  taskMasterId: string | null;
  name: string | null;
  country: string | null;
  teamSize: string | null;
}): Promise<string> {
  const orgsCollection = collection(firestore, COLLECTIONS.ORGANIZATIONS);
  const data: Omit<Organization, 'id'> = {
    taskMasterId,
    name,
    country,
    teamSize,
    timeCreated: serverTimestamp() as Timestamp,
    timeUpdated: serverTimestamp() as Timestamp,
  };
  const docRef = await addDoc(orgsCollection, data);
  return docRef.id;
} 