import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../clientConfig';
import { COLLECTIONS } from '../constants/collections';

export async function updateTaskMasterOrganizationId(taskMasterId: string, organizationId: string) {
  if (!firestore) throw new Error('Firestore not available');
  const taskMasterRef = doc(firestore, COLLECTIONS.TASK_MASTERS, taskMasterId);
  await updateDoc(taskMasterRef, { organizationId });
} 