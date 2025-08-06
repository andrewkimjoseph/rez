import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TaskStep = 1 | 2 | 3 | 4 | 5;

export interface NewTaskData {
  // Step 1: Task Type
  type?: 'Survey' | 'Non-survey';
  // Step 2: Task Details
  title?: string;
  category?: 'Finance' | 'Climate' | 'Education' | 'Health' | 'Technology' | 'Other';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  payout?: number;
  fee?: number;
  // Step 3: Targeting
  countries?: string[];
  gender?: 'Male' | 'Female' | 'All';
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

export const useNewTaskStore = create<NewTaskStore>()(
  persist(
    (set, get) => ({
      step: 1,
      data: {},
      setStep: (step) => set({ step }),
      nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 5) as TaskStep })),
      prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) as TaskStep })),
      updateData: (data) => set((state) => ({ data: { ...state.data, ...data } })),
      reset: () => set({ step: 1, data: {} }),
    }),
    {
      name: 'new-task-storage',
      partialize: (state) => ({ step: state.step, data: state.data }),
    }
  )
); 