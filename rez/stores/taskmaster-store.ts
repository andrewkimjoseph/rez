import { create } from 'zustand';

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

export const useTaskMasterStore = create<TaskMasterStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
})); 