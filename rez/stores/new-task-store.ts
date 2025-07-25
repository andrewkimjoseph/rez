import { create } from 'zustand';

export type TaskStep = 1 | 2 | 3 | 4 | 5;

export interface NewTaskData {
  // Step 1: Task Type
  type?: 'survey' | 'non-survey';
  // Step 2: Task Details
  title?: string;
  category?: 'finance' | 'climate' | 'education';
  difficulty?: 'easy' | 'medium' | 'hard';
  payout?: number;
  fee?: number;
  // Step 3: Targeting
  countries?: string[];
  gender?: 'male' | 'female' | 'all';
  minAge?: number;
  maxAge?: number;
  // Step 4: Questions & Tasks
  tallyFormUrl?: string;
  // Step 5: Review (no extra fields, just review all above)
}

interface NewTaskStore {
  step: TaskStep;
  data: NewTaskData;
  setStep: (step: TaskStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (data: Partial<NewTaskData>) => void;
  reset: () => void;
}

export const useNewTaskStore = create<NewTaskStore>((set, get) => ({
  step: 1,
  data: {},
  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 5) as TaskStep })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) as TaskStep })),
  updateData: (data) => set((state) => ({ data: { ...state.data, ...data } })),
  reset: () => set({ step: 1, data: {} }),
})); 