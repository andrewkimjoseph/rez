import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';
import { COLLECTIONS } from '../constants/collections';

export async function updateTaskMasterOrganizationId(taskMasterId: string, organizationId: string) {
  const taskMasterRef = doc(firestore, COLLECTIONS.TASK_MASTERS, taskMasterId);
  await updateDoc(taskMasterRef, { organizationId });
} 