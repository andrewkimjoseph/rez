import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { FieldValue } from 'firebase-admin/firestore';

interface UpdateTaskStatusParams {
  taskId: string;
  isAvailable: boolean;
  rezTaskMasterEmailAddress: string;
}

export async function updateTaskStatusInPaxApp({
  taskId,
  isAvailable,
  rezTaskMasterEmailAddress,
}: UpdateTaskStatusParams): Promise<void> {
  const taskRef = paxDB.collection(COLLECTIONS.TASKS).doc(taskId);
  
  // Verify the task exists and belongs to the task master
  const taskDoc = await taskRef.get();
  
  if (!taskDoc.exists) {
    throw new Error('Task not found');
  }
  
  const taskData = taskDoc.data();
  
  if (taskData?.rezTaskMasterEmailAddress !== rezTaskMasterEmailAddress) {
    throw new Error('Unauthorized: Task does not belong to this task master');
  }
  
  // Update the task status
  await taskRef.update({
    isAvailable,
    timeUpdated: FieldValue.serverTimestamp(),
  });
}

