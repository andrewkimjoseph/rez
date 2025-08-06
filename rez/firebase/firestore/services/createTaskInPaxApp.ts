import { FieldValue } from 'firebase-admin/firestore';
import { Task } from '../models/Task';
import { paxDB } from '../../serverConfig';
import { COLLECTIONS } from '../constants/collections';
import { TASK_MASTER_ID, TASK_MANAGER_CONTRACT_ADDRESS } from '../../../data/constants';

export interface CreateTaskData {
  type: 'Survey' | 'Non-survey';
  title: string;
  category: 'Finance' | 'Climate' | 'Education' | 'Health' | 'Technology' | 'Other';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  countries?: string[];
  gender?: 'Male' | 'Female' | 'All';
  tallyFormUrl?: string | null;
  rezTaskMasterEmailAddress?: string | null;
}

export async function createTaskInPaxApp(taskData: CreateTaskData): Promise<string> {
  const taskRef = paxDB.collection(COLLECTIONS.TASKS).doc();
  
  // Map the form data to Task model fields
  const task: Omit<Task, 'timeCreated' | 'timeUpdated' | 'deadline'> & {
    timeCreated: FieldValue;
    timeUpdated: FieldValue;
    deadline: FieldValue;
  } = {
    id: null, // Will be set after creation
    taskMasterId: TASK_MASTER_ID,
    title: taskData.title,
    type: taskData.type,
    category: taskData.category,
    estimatedTimeOfCompletionInMinutes: 5,
    targetNumberOfParticipants: 100,
    link: taskData.tallyFormUrl || null,
    levelOfDifficulty: taskData.difficulty || "Easy",
    deadline: FieldValue.serverTimestamp(), // Not collected in form
    managerContractAddress: TASK_MANAGER_CONTRACT_ADDRESS,
    rewardAmountPerParticipant: 0.15, // Not collected in form
    rewardCurrencyId: 2,
    isAvailable: false, // Default to available
    timeCreated: FieldValue.serverTimestamp(),
    timeUpdated: FieldValue.serverTimestamp(),
    isTest: false, // Default to not test
    rezTaskMasterEmailAddress: taskData.rezTaskMasterEmailAddress || null,
  };

  await taskRef.set(task);
  
  const taskWithId: Omit<Task, 'timeCreated' | 'timeUpdated' | 'deadline'> & {
    timeCreated: FieldValue;
    timeUpdated: FieldValue;
    deadline: FieldValue;
  } = {
    ...task,
    id: taskRef.id,
  };
  
  await taskRef.set(taskWithId, { merge: true });
  
  return taskRef.id;
} 