import { create } from 'zustand';
import { Task } from '@/firebase/firestore/models/Task';

export type TaskStep = 1 | 2 | 3 | 4 | 5;

export interface NewTaskData {
  // Step 1: Task Type
  type?: 'fillAForm' | 'checkOutApp' | 'doVideoInterview';
  // Step 2: Task Details
  title?: string;
  category?: 'Finance' | 'Climate' | 'Education' | 'Health' | 'Technology' | 'Social' | 'Other';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  payout?: number;
  fee?: number;
  // Step 3: Cost
  targetNumberOfParticipants?: number; // Number of participants (for fillAForm) or testers (for checkOutApp)
  numberOfQuestions?: number; // Number of questions (for fillAForm tasks)
  numberOfFeedbackQuestions?: number; // Number of feedback questions (for checkOutApp tasks)
  // Step 4: Questions & Tasks (Links)
  link?: string; // Link to form or product
  instructions?: string; // Instructions for completing the task
  feedback?: string; // Link to feedback form (for checkOutApp)
  // Step 5: Review (no extra fields, just review all above)
  // Super admin only: Assign to different task master
  assignToTaskMaster?: boolean;
  assignedTaskMasterEmailAddress?: string;
}

interface NewTaskStore {
  step: TaskStep;
  data: NewTaskData;
  editMode: boolean;
  editingTaskId: string | null;
  editingTaskReasons: number[] | undefined;
  originalTaskData: NewTaskData | null; // Store original values to detect changes
  setStep: (step: TaskStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (data: Partial<NewTaskData>) => void;
  loadTaskForEdit: (task: Task) => void;
  reset: () => void;
  hasFieldChanged: (fieldName: keyof NewTaskData) => boolean;
}

export const useNewTaskStore = create<NewTaskStore>()((set, get) => ({
  step: 1,
  data: {},
  editMode: false,
  editingTaskId: null,
  editingTaskReasons: undefined,
  originalTaskData: null,
  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 5) as TaskStep })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) as TaskStep })),
  updateData: (data) => set((state) => ({ data: { ...state.data, ...data } })),
  loadTaskForEdit: (task: Task) => {
    const taskData = {
      type: (task.type as 'fillAForm' | 'checkOutApp' | 'doVideoInterview') || undefined,
      title: task.title || undefined,
      category: (task.category as 'Finance' | 'Climate' | 'Education' | 'Health' | 'Technology' | 'Social' | 'Other') || undefined,
      difficulty: (task.levelOfDifficulty as 'Easy' | 'Medium' | 'Hard') || undefined,
      targetNumberOfParticipants: task.targetNumberOfParticipants || undefined,
      numberOfQuestions: task.numberOfQuestions || undefined,
      numberOfFeedbackQuestions: task.numberOfFeedbackQuestions || undefined,
      link: task.link || undefined,
      instructions: task.instructions || undefined,
      feedback: task.feedback || undefined,
    };
    set({
      editMode: true,
      editingTaskId: task.id || null,
      editingTaskReasons: task.reasonsForRejection,
      originalTaskData: taskData,
      step: 1,
      data: taskData,
    });
  },
  hasFieldChanged: (fieldName: keyof NewTaskData) => {
    const state = get();
    if (!state.editMode || !state.originalTaskData) return false;
    const currentValue = state.data[fieldName];
    const originalValue = state.originalTaskData[fieldName];
    return currentValue !== originalValue;
  },
  reset: () => set({ 
    step: 1, 
    data: {},
    editMode: false,
    editingTaskId: null,
    editingTaskReasons: undefined,
    originalTaskData: null,
  }),
}));
