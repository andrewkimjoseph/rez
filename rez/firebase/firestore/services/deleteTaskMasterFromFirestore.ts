import { doc, deleteDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/clientConfig';
import { COLLECTIONS } from '../constants/collections';

export async function deleteTaskMasterFromFirestore(taskMasterId: string): Promise<void> {
  if (!firestore) throw new Error('Firestore not available');
  const taskMasterRef = doc(firestore, COLLECTIONS.TASK_MASTERS, taskMasterId);
  await deleteDoc(taskMasterRef);
}

