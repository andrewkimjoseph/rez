import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { Task } from '../models/Task';
import { paxDB } from '../../serverConfig';
import { COLLECTIONS } from '../constants/collections';
import { TASK_MASTER_ID, TASK_MANAGER_CONTRACT_ADDRESS } from '../../../data/constants';

export interface CreateTaskData {
  type: 'fillAForm' | 'checkOutApp' | 'doVideoInterview' | 'answerPoll';
  title: string;
  category: 'Finance' | 'Climate' | 'Education' | 'Health' | 'Technology' | 'Other';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  gender?: 'Male' | 'Female' | 'All';
  link?: string | null;
  instructions?: string | null;
  feedback?: string | null;
  rezTaskMasterEmailAddress?: string | null;
  targetNumberOfParticipants?: number;
  numberOfQuestions?: number;
  numberOfFeedbackQuestions?: number;
}

export async function createTaskInPaxApp(taskData: CreateTaskData): Promise<string> {
  const taskRef = paxDB.collection(COLLECTIONS.TASKS).doc();
  
  // Default instructions for fillAForm and answerPoll tasks
  const defaultFillAFormInstructions = "Hi there! Thanks for taking the time to complete this form. We really appreciate thoughtful, genuine responses - they help us understand how to better support you. Please answer each question as clearly as you can. Your authentic input matters to us and helps maintain the quality of our service for everyone.";
  const defaultPollInstructions = "Thanks for participating in this poll. Please read the question carefully and select the option that best reflects your view.";
  
  // Determine instructions based on task type
  const instructions = taskData.type === 'fillAForm'
    ? defaultFillAFormInstructions
    : taskData.type === 'answerPoll'
    ? (taskData.instructions || defaultPollInstructions)
    : (taskData.instructions || null);
  
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
    targetNumberOfParticipants: taskData.targetNumberOfParticipants || 100,
    numberOfQuestions: taskData.numberOfQuestions || null,
    numberOfFeedbackQuestions: taskData.numberOfFeedbackQuestions || null,
    link: taskData.link || null,
    levelOfDifficulty: taskData.difficulty || "Easy",
    deadline: Timestamp.fromDate(new Date(Date.now() + 12 * 60 * 60 * 1000)), // 12 hours from now
    managerContractAddress: TASK_MANAGER_CONTRACT_ADDRESS,
    rewardAmountPerParticipant: 100, // Not collected in form
    rewardCurrencyId: 1, // G$
    isAvailable: false, // Default to not available until approved
    reviewStatus: 'pending', // Tasks require superadmin approval
    timeCreated: FieldValue.serverTimestamp(),
    timeUpdated: FieldValue.serverTimestamp(),
    isTest: false, // Default to not test
    feedback: taskData.feedback || null,
    paymentTerms: 'delayed',
    instructions: instructions,
    targetCountry: "ALL",
    numberOfCooldownHours: 2,
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