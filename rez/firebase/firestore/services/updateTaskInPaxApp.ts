import { FieldValue } from 'firebase-admin/firestore';
import { paxDB } from '../../serverConfig';
import { COLLECTIONS } from '../constants/collections';

export interface UpdateTaskData {
  title?: string;
  type?: 'fillAForm' | 'checkOutApp' | 'doVideoInterview';
  category?: string;
  levelOfDifficulty?: string;
  link?: string;
  instructions?: string;
  feedback?: string;
  targetCountry?: string;
}

interface UpdateTaskParams {
  taskId: string;
  data: UpdateTaskData;
  rezTaskMasterEmailAddress: string;
}

export async function updateTaskInPaxApp({
  taskId,
  data,
  rezTaskMasterEmailAddress,
}: UpdateTaskParams): Promise<void> {
  const taskRef = paxDB.collection(COLLECTIONS.TASKS).doc(taskId);
  
  const taskDoc = await taskRef.get();
  
  if (!taskDoc.exists) {
    throw new Error('Task not found');
  }
  
  const taskData = taskDoc.data();
  
  if (taskData?.rezTaskMasterEmailAddress !== rezTaskMasterEmailAddress) {
    throw new Error('Unauthorized: Task does not belong to this task master');
  }
  
  // Filter out undefined values
  const updateData: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updateData[key] = value;
    }
  });
  
  if (Object.keys(updateData).length === 0) {
    throw new Error('No valid fields to update');
  }
  
  await taskRef.update({
    ...updateData,
    timeUpdated: FieldValue.serverTimestamp(),
  });
}

