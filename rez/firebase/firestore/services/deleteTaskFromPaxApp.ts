import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';

interface DeleteTaskParams {
  taskId: string;
  rezTaskMasterEmailAddress: string;
}

export async function deleteTaskFromPaxApp({
  taskId,
  rezTaskMasterEmailAddress,
}: DeleteTaskParams): Promise<void> {
  const taskRef = paxDB().collection(COLLECTIONS.TASKS).doc(taskId);
  
  // Verify the task exists and belongs to the task master
  const taskDoc = await taskRef.get();
  
  if (!taskDoc.exists) {
    throw new Error('Task not found');
  }
  
  const taskData = taskDoc.data();
  
  if (taskData?.rezTaskMasterEmailAddress !== rezTaskMasterEmailAddress) {
    throw new Error('Unauthorized: Task does not belong to this task master');
  }
  
  // Delete the task
  await taskRef.delete();
}

