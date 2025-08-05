import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../clientConfig';
import { COLLECTIONS } from '../constants/collections';
import { TaskMaster } from '../models/TaskMaster';

export async function getTaskMasterFromFirestore(id: string): Promise<TaskMaster | null> {
  const taskMasterRef = doc(firestore, COLLECTIONS.TASK_MASTERS, id);
  const docSnap = await getDoc(taskMasterRef);
  if (!docSnap.exists()) {
    return null;
  }
  return docSnap.data() as TaskMaster;
} 