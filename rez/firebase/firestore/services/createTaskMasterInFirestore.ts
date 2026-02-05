import { getFirestore, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { TaskMaster } from '../models/TaskMaster';
import { firestore } from '../../clientConfig';
import { COLLECTIONS } from '../constants/collections';

export async function createTaskMasterInFirestore({
  id,
  name,
  emailAddress,
  profilePictureURI,
  organizationId = null,
  privyDid = null,
}: {
  id: string;
  name: string | null;
  emailAddress: string | null;
  profilePictureURI: string | null;
  organizationId?: string | null;
  privyDid?: string | null;
}): Promise<void> {
  if (!firestore) throw new Error('Firestore not available');
  const taskMasterRef = doc(firestore, COLLECTIONS.TASK_MASTERS, id);
  const data: TaskMaster = {
    id,
    name,
    emailAddress,
    profilePictureURI,
    organizationId,
    privyDid,
    timeCreated: serverTimestamp() as Timestamp,
    timeUpdated: serverTimestamp() as Timestamp,
  };
  await setDoc(taskMasterRef, data, { merge: true });
} 