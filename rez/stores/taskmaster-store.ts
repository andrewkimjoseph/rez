import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TaskMasterStoreUser {
  id: string;
  name: string | null;
  emailAddress: string | null;
  profilePictureURI: string | null;
  organizationId: string | null;
  privyDid: string | null;
}

interface TaskMasterStore {
  user: TaskMasterStoreUser | null;
  setUser: (user: TaskMasterStoreUser | null) => void;
}

export const useTaskMasterStore = create<TaskMasterStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'taskmaster-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
); 