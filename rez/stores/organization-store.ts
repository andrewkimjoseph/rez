import { create } from 'zustand';
import { Organization } from '@/firebase/firestore/models/Organization';

interface OrganizationStore {
  organization: Organization | null;
  setOrganization: (organization: Organization | null) => void;
}

export const useOrganizationStore = create<OrganizationStore>((set) => ({
  organization: null,
  setOrganization: (organization) => set({ organization }),
})); 