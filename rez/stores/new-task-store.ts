import { create } from 'zustand';
import { Task } from '@/firebase/firestore/models/Task';
import type { PollQuestionDraft } from '@/types/poll';

export type TaskStep = 1 | 2 | 3 | 4 | 5;

export interface NewTaskData {
  type?: 'fillAForm' | 'checkOutApp' | 'doVideoInterview' | 'answerPoll';
  title?: string;
  category?: 'Finance' | 'Climate' | 'Education' | 'Health' | 'Technology' | 'Social' | 'Other';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  payout?: number;
  fee?: number;
  targetNumberOfParticipants?: number;
  numberOfQuestions?: number;
  numberOfFeedbackQuestions?: number;
  countries?: string[];
  gender?: 'Male' | 'Female' | 'All';
  minAge?: number;
  maxAge?: number;
  link?: string;
  instructions?: string;
  feedback?: string;
  pollQuestions?: PollQuestionDraft[];
  assignToTaskMaster?: boolean;
  assignedTaskMasterEmailAddress?: string;
}

interface NewTaskStore {
  step: TaskStep;
  data: NewTaskData;
  editMode: boolean;
  editingTaskId: string | null;
  editingTaskReasons: number[] | undefined;
  originalTaskData: NewTaskData | null;
  originalPollQuestions: PollQuestionDraft[] | null;
  setStep: (step: TaskStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (data: Partial<NewTaskData>) => void;
  loadTaskForEdit: (task: Task) => void;
  hydratePollQuestions: (pollQuestions: PollQuestionDraft[]) => void;
  reset: () => void;
  hasFieldChanged: (fieldName: keyof NewTaskData) => boolean;
  hasPollQuestionsChanged: () => boolean;
}

export const useNewTaskStore = create<NewTaskStore>()((set, get) => ({
  step: 1,
  data: {},
  editMode: false,
  editingTaskId: null,
  editingTaskReasons: undefined,
  originalTaskData: null,
  originalPollQuestions: null,
  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 5) as TaskStep })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) as TaskStep })),
  updateData: (data) => set((state) => ({ data: { ...state.data, ...data } })),
  loadTaskForEdit: (task: Task) => {
    const taskData: NewTaskData = {
      type: (task.type as NewTaskData['type']) || undefined,
      title: task.title || undefined,
      category: (task.category as NewTaskData['category']) || undefined,
      difficulty: (task.levelOfDifficulty as NewTaskData['difficulty']) || undefined,
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
      originalPollQuestions: null,
      step: 1,
      data: taskData,
    });
  },
  hydratePollQuestions: (pollQuestions) => {
    const normalized = pollQuestions.length
      ? pollQuestions
      : [{ questionText: '', options: ['', ''] }];
    set((state) => ({
      data: { ...state.data, pollQuestions: normalized },
      originalPollQuestions: state.originalPollQuestions ?? JSON.parse(JSON.stringify(normalized)),
    }));
  },
  hasFieldChanged: (fieldName: keyof NewTaskData) => {
    const state = get();
    if (!state.editMode || !state.originalTaskData) return false;
    const currentValue = state.data[fieldName];
    const originalValue = state.originalTaskData[fieldName];
    return currentValue !== originalValue;
  },
  hasPollQuestionsChanged: () => {
    const state = get();
    if (!state.editMode || !state.originalPollQuestions) return false;
    return JSON.stringify(state.data.pollQuestions) !== JSON.stringify(state.originalPollQuestions);
  },
  reset: () =>
    set({
      step: 1,
      data: {},
      editMode: false,
      editingTaskId: null,
      editingTaskReasons: undefined,
      originalTaskData: null,
      originalPollQuestions: null,
    }),
}));
