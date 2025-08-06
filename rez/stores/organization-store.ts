import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Organization } from '@/firebase/firestore/models/Organization';

interface OrganizationStore {
  organization: Organization | null;
  setOrganization: (organization: Organization | null) => void;
}

export const useOrganizationStore = create<OrganizationStore>()(
  persist(
    (set) => ({
      organization: null,
      setOrganization: (organization) => set({ organization }),
    }),
    {
      name: 'organization-storage',
      partialize: (state) => ({ organization: state.organization }),
    }
  )
); 