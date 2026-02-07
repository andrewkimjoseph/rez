import { create } from 'zustand';
import { fetchWithAuthRetry } from '@/lib/api-fetch';
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
  numberOfQuestions?: number;
  numberOfFeedbackQuestions?: number;
  rewardAmountPerParticipant?: number;
  rewardCurrencyId?: number;
  numberOfCooldownHours?: number;
  paymentTerms?: string;
  managerContractAddress?: string;
  rezTaskMasterEmailAddress?: string; // Super admin can reassign task to different task master
  reviewStatus?: 'pending' | 'approved' | 'rejected' | 'published' | 'archived'; // Task review workflow
  reasonsForRejection?: number[]; // Array of rejection reason IDs (1-8)
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
  isLoadingMoreTasks: boolean;
  isLoadingMoreTaskMasters: boolean;
  hasMoreTasks: boolean;
  hasMoreTaskMasters: boolean;
  tasksNextCursor: { startAfterDocId: string } | null;
  taskMastersNextCursor: { startAfterDocId: string } | null;
  isUpdating: boolean;
  isDeleting: boolean;
  isTogglingStatus: boolean;
  error: string | null;
  lastTasksFetch: number | null;
  lastTaskMastersFetch: number | null;

  fetchAllTasks: (forceRefresh?: boolean) => Promise<void>;
  fetchAllTaskMasters: (forceRefresh?: boolean) => Promise<void>;
  loadMoreTasks: () => Promise<void>;
  loadMoreTaskMasters: () => Promise<void>;
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
  isLoadingMoreTasks: false,
  isLoadingMoreTaskMasters: false,
  hasMoreTasks: false,
  hasMoreTaskMasters: false,
  tasksNextCursor: null,
  taskMastersNextCursor: null,
  isUpdating: false,
  isDeleting: false,
  isTogglingStatus: false,
  error: null,
  lastTasksFetch: null,
  lastTaskMastersFetch: null,

  fetchAllTasks: async (forceRefresh = false) => {
    const { tasks, lastTasksFetch, isLoadingTasks } = get();
    const now = Date.now();

    if (isLoadingTasks) return;

    if (!forceRefresh && tasks.length > 0 && lastTasksFetch && now - lastTasksFetch < CACHE_DURATION) {
      return;
    }

    set({ isLoadingTasks: true, error: null });

    try {
      const response = await fetchWithAuthRetry('/api/admin/fetchAllTasks?limit=50');
      const { tasks: newTasks, hasMore, nextCursor } = await response.json();
      set({
        tasks: newTasks || [],
        isLoadingTasks: false,
        lastTasksFetch: Date.now(),
        hasMoreTasks: !!hasMore,
        tasksNextCursor: nextCursor,
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      set({
        isLoadingTasks: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
      });
    }
  },

  loadMoreTasks: async () => {
    const { tasksNextCursor, isLoadingMoreTasks, hasMoreTasks } = get();
    if (!tasksNextCursor || isLoadingMoreTasks || !hasMoreTasks) return;

    set({ isLoadingMoreTasks: true, error: null });

    try {
      const url = `/api/admin/fetchAllTasks?limit=50&startAfterDocId=${encodeURIComponent(tasksNextCursor.startAfterDocId)}`;
      const response = await fetchWithAuthRetry(url);
      const { tasks: moreTasks, hasMore, nextCursor } = await response.json();
      const currentTasks = get().tasks;
      set({
        tasks: [...currentTasks, ...(moreTasks || [])],
        isLoadingMoreTasks: false,
        hasMoreTasks: !!hasMore,
        tasksNextCursor: nextCursor,
      });
    } catch (error) {
      console.error('Error loading more tasks:', error);
      set({
        isLoadingMoreTasks: false,
        error: error instanceof Error ? error.message : 'Failed to load more tasks',
      });
    }
  },

  fetchAllTaskMasters: async (forceRefresh = false) => {
    const { taskMasters, lastTaskMastersFetch, isLoadingTaskMasters } = get();
    const now = Date.now();

    if (isLoadingTaskMasters) return;

    if (!forceRefresh && taskMasters.length > 0 && lastTaskMastersFetch && now - lastTaskMastersFetch < CACHE_DURATION) {
      return;
    }

    set({ isLoadingTaskMasters: true, error: null });

    try {
      const response = await fetchWithAuthRetry('/api/admin/fetchAllTaskMasters?limit=50');
      const { taskMasters: newTaskMasters, hasMore, nextCursor } = await response.json();
      set({
        taskMasters: newTaskMasters || [],
        isLoadingTaskMasters: false,
        lastTaskMastersFetch: Date.now(),
        hasMoreTaskMasters: !!hasMore,
        taskMastersNextCursor: nextCursor,
      });
    } catch (error) {
      console.error('Error fetching task masters:', error);
      set({
        isLoadingTaskMasters: false,
        error: error instanceof Error ? error.message : 'Failed to fetch task masters',
      });
    }
  },

  loadMoreTaskMasters: async () => {
    const { taskMastersNextCursor, isLoadingMoreTaskMasters, hasMoreTaskMasters } = get();
    if (!taskMastersNextCursor || isLoadingMoreTaskMasters || !hasMoreTaskMasters) return;

    set({ isLoadingMoreTaskMasters: true, error: null });

    try {
      const url = `/api/admin/fetchAllTaskMasters?limit=50&startAfterDocId=${encodeURIComponent(taskMastersNextCursor.startAfterDocId)}`;
      const response = await fetchWithAuthRetry(url);
      const { taskMasters: moreTaskMasters, hasMore, nextCursor } = await response.json();
      const currentTaskMasters = get().taskMasters;
      set({
        taskMasters: [...currentTaskMasters, ...(moreTaskMasters || [])],
        isLoadingMoreTaskMasters: false,
        hasMoreTaskMasters: !!hasMore,
        taskMastersNextCursor: nextCursor,
      });
    } catch (error) {
      console.error('Error loading more task masters:', error);
      set({
        isLoadingMoreTaskMasters: false,
        error: error instanceof Error ? error.message : 'Failed to load more task masters',
      });
    }
  },

  updateTask: async (taskId: string, data: AdminUpdateTaskData): Promise<boolean> => {
    set({ isUpdating: true, error: null });

    try {
      const response = await fetchWithAuthRetry('/api/admin/updateTask', {
        method: 'PATCH',
        body: JSON.stringify({ taskId, data })
      });

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
      const response = await fetchWithAuthRetry(
        `/api/admin/deleteTask?taskId=${encodeURIComponent(taskId)}`,
        { method: 'DELETE' }
      );

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
      const response = await fetchWithAuthRetry('/api/admin/updateTaskMaster', {
        method: 'PATCH',
        body: JSON.stringify({ taskMasterId, data })
      });

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
      const response = await fetchWithAuthRetry('/api/admin/toggleTaskMasterStatus', {
        method: 'PATCH',
        body: JSON.stringify({ taskMasterId, disabled })
      });

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
    lastTaskMastersFetch: null,
    hasMoreTasks: false,
    hasMoreTaskMasters: false,
    tasksNextCursor: null,
    taskMastersNextCursor: null,
  }),
}));

