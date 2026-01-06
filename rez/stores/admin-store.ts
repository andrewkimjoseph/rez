import { create } from 'zustand';
import { Task } from '@/firebase/firestore/models/Task';
import { TaskMaster } from '@/firebase/firestore/models/TaskMaster';
import { useTaskMasterStore } from './taskmaster-store';

export interface AdminUpdateTaskData {
  title?: string;
  type?: 'fillAForm' | 'checkOutApp' | 'doVideoInterview';
  category?: string;
  levelOfDifficulty?: string;
  link?: string;
  instructions?: string;
  feedback?: string;
  targetCountry?: string;
  isAvailable?: boolean;
  isTest?: boolean;
  estimatedTimeOfCompletionInMinutes?: number;
  targetNumberOfParticipants?: number;
  rewardAmountPerParticipant?: number;
  rewardCurrencyId?: number;
  numberOfCooldownHours?: number;
  paymentTerms?: string;
  managerContractAddress?: string;
}

export interface AdminUpdateTaskMasterData {
  name?: string;
  emailAddress?: string;
  organizationId?: string;
  isSuperAdmin?: boolean;
}

// Cache duration: 30 minutes
const CACHE_DURATION = 30 * 60 * 1000;

interface AdminStore {
  tasks: Task[];
  taskMasters: TaskMaster[];
  isLoadingTasks: boolean;
  isLoadingTaskMasters: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isTogglingStatus: boolean;
  error: string | null;
  lastTasksFetch: number | null;
  lastTaskMastersFetch: number | null;
  
  fetchAllTasks: (forceRefresh?: boolean) => Promise<void>;
  fetchAllTaskMasters: (forceRefresh?: boolean) => Promise<void>;
  updateTask: (taskId: string, data: AdminUpdateTaskData) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  updateTaskMaster: (taskMasterId: string, data: AdminUpdateTaskMasterData) => Promise<boolean>;
  toggleTaskMasterStatus: (taskMasterId: string, disabled: boolean) => Promise<boolean>;
  clearError: () => void;
  clearCache: () => void;
}

export const useAdminStore = create<AdminStore>()((set, get) => ({
  tasks: [],
  taskMasters: [],
  isLoadingTasks: false,
  isLoadingTaskMasters: false,
  isUpdating: false,
  isDeleting: false,
  isTogglingStatus: false,
  error: null,
  lastTasksFetch: null,
  lastTaskMastersFetch: null,

  fetchAllTasks: async (forceRefresh = false) => {
    const { tasks, lastTasksFetch, isLoadingTasks } = get();
    const now = Date.now();
    
    // Skip if already loading
    if (isLoadingTasks) return;
    
    // Skip if we have cached data and it's not stale (unless forced)
    if (!forceRefresh && tasks.length > 0 && lastTasksFetch && (now - lastTasksFetch) < CACHE_DURATION) {
      return;
    }

    set({ isLoadingTasks: true, error: null });

    try {
      const response = await fetch('/api/admin/fetchAllTasks');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch tasks');
      }

      const { tasks } = await response.json();
      set({ tasks, isLoadingTasks: false, lastTasksFetch: Date.now() });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      set({
        isLoadingTasks: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tasks'
      });
    }
  },

  fetchAllTaskMasters: async (forceRefresh = false) => {
    const { taskMasters, lastTaskMastersFetch, isLoadingTaskMasters } = get();
    const now = Date.now();
    
    // Skip if already loading
    if (isLoadingTaskMasters) return;
    
    // Skip if we have cached data and it's not stale (unless forced)
    if (!forceRefresh && taskMasters.length > 0 && lastTaskMastersFetch && (now - lastTaskMastersFetch) < CACHE_DURATION) {
      return;
    }

    set({ isLoadingTaskMasters: true, error: null });

    try {
      const response = await fetch('/api/admin/fetchAllTaskMasters');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch task masters');
      }

      const { taskMasters } = await response.json();
      set({ taskMasters, isLoadingTaskMasters: false, lastTaskMastersFetch: Date.now() });
    } catch (error) {
      console.error('Error fetching task masters:', error);
      set({
        isLoadingTaskMasters: false,
        error: error instanceof Error ? error.message : 'Failed to fetch task masters'
      });
    }
  },

  updateTask: async (taskId: string, data: AdminUpdateTaskData): Promise<boolean> => {
    set({ isUpdating: true, error: null });

    try {
      const response = await fetch('/api/admin/updateTask', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, data })
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Failed to update task');
      }

      // Force refresh tasks list
      set({ isUpdating: false });
      await get().fetchAllTasks(true);
      
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      set({
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update task'
      });
      return false;
    }
  },

  deleteTask: async (taskId: string): Promise<boolean> => {
    set({ isDeleting: true, error: null });

    try {
      const response = await fetch(
        `/api/admin/deleteTask?taskId=${encodeURIComponent(taskId)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete task');
      }

      // Remove task from local state and update cache timestamp
      const currentTasks = get().tasks;
      set({ 
        tasks: currentTasks.filter(t => t.id !== taskId),
        isDeleting: false,
        lastTasksFetch: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      set({
        isDeleting: false,
        error: error instanceof Error ? error.message : 'Failed to delete task'
      });
      return false;
    }
  },

  updateTaskMaster: async (taskMasterId: string, data: AdminUpdateTaskMasterData): Promise<boolean> => {
    set({ isUpdating: true, error: null });

    try {
      const response = await fetch('/api/admin/updateTaskMaster', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskMasterId, data })
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Failed to update task master');
      }

      // Force refresh task masters list
      set({ isUpdating: false });
      await get().fetchAllTaskMasters(true);
      
      return true;
    } catch (error) {
      console.error('Error updating task master:', error);
      set({
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update task master'
      });
      return false;
    }
  },

  toggleTaskMasterStatus: async (taskMasterId: string, disabled: boolean): Promise<boolean> => {
    set({ isTogglingStatus: true, error: null });

    try {
      const response = await fetch('/api/admin/toggleTaskMasterStatus', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskMasterId, disabled })
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Failed to toggle task master status');
      }

      set({ isTogglingStatus: false });
      return true;
    } catch (error) {
      console.error('Error toggling task master status:', error);
      set({
        isTogglingStatus: false,
        error: error instanceof Error ? error.message : 'Failed to toggle task master status'
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
  
  clearCache: () => set({ 
    tasks: [], 
    taskMasters: [], 
    lastTasksFetch: null, 
    lastTaskMastersFetch: null 
  }),
}));

