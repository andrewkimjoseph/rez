import { create } from 'zustand';
import { fetchWithAuthRetry } from '@/lib/api-fetch';
import { Task } from '@/firebase/firestore/models/Task';
import { TaskMaster } from '@/firebase/firestore/models/TaskMaster';
import { useTaskMasterStore } from './taskmaster-store';
import type { PollQuestionDraft } from '@/types/poll';

export interface AdminUpdateTaskData {
  title?: string;
  type?: 'fillAForm' | 'checkOutApp' | 'doVideoInterview' | 'answerPoll';
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
  deadline?: string | null; // ISO date string; null to clear
  paymentTerms?: string | null;
  managerContractAddress?: string;
  rezTaskMasterEmailAddress?: string; // Super admin can reassign task to different task master
  reviewStatus?: 'pending' | 'approved' | 'rejected' | 'published' | 'archived'; // Task review workflow
  reasonsForRejection?: number[]; // Array of rejection reason IDs (1-8)
  pollQuestions?: PollQuestionDraft[];
}

export interface AdminUpdateTaskMasterData {
  name?: string;
  emailAddress?: string;
  organizationId?: string;
  isSuperAdmin?: boolean;
}

export interface AdminParticipant {
  id: string;
  emailAddress: string | null;
  displayName: string | null;
  disabled: boolean;
}

// Cache duration: 30 minutes
const CACHE_DURATION = 30 * 60 * 1000;

interface AdminStore {
  tasks: Task[];
  taskMasters: TaskMaster[];
  participants: AdminParticipant[];
  isLoadingTasks: boolean;
  isLoadingTaskMasters: boolean;
  isLoadingParticipants: boolean;
  isLoadingMoreTasks: boolean;
  isLoadingMoreTaskMasters: boolean;
  isLoadingMoreParticipants: boolean;
  hasMoreTasks: boolean;
  hasMoreTaskMasters: boolean;
  hasMoreParticipants: boolean;
  tasksNextCursor: { startAfterDocId: string } | null;
  taskMastersNextCursor: { startAfterDocId: string } | null;
  participantsNextCursor: { startAfterDocId: string } | null;
  participantsSearchQuery: string;
  isUpdating: boolean;
  isDeleting: boolean;
  isTogglingStatus: boolean;
  isTogglingParticipantStatus: boolean;
  error: string | null;
  lastTasksFetch: number | null;
  lastTaskMastersFetch: number | null;
  lastParticipantsFetch: number | null;

  fetchAllTasks: (forceRefresh?: boolean, preferFirestore?: boolean) => Promise<void>;
  fetchAllTaskMasters: (forceRefresh?: boolean) => Promise<void>;
  fetchAllParticipants: (forceRefresh?: boolean, search?: string) => Promise<void>;
  loadMoreTasks: () => Promise<void>;
  loadMoreTaskMasters: () => Promise<void>;
  loadMoreParticipants: () => Promise<void>;
  updateTask: (taskId: string, data: AdminUpdateTaskData) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  updateTaskMaster: (taskMasterId: string, data: AdminUpdateTaskMasterData) => Promise<boolean>;
  toggleTaskMasterStatus: (taskMasterId: string, disabled: boolean) => Promise<boolean>;
  toggleParticipantStatus: (participantId: string, disabled: boolean) => Promise<boolean>;
  clearError: () => void;
  clearCache: () => void;
}

export const useAdminStore = create<AdminStore>()((set, get) => ({
  tasks: [],
  taskMasters: [],
  participants: [],
  isLoadingTasks: false,
  isLoadingTaskMasters: false,
  isLoadingParticipants: false,
  isLoadingMoreTasks: false,
  isLoadingMoreTaskMasters: false,
  isLoadingMoreParticipants: false,
  hasMoreTasks: false,
  hasMoreTaskMasters: false,
  hasMoreParticipants: false,
  tasksNextCursor: null,
  taskMastersNextCursor: null,
  participantsNextCursor: null,
  participantsSearchQuery: '',
  isUpdating: false,
  isDeleting: false,
  isTogglingStatus: false,
  isTogglingParticipantStatus: false,
  error: null,
  lastTasksFetch: null,
  lastTaskMastersFetch: null,
  lastParticipantsFetch: null,

  fetchAllTasks: async (forceRefresh = false, preferFirestore = false) => {
    const { tasks, lastTasksFetch, isLoadingTasks } = get();
    const now = Date.now();

    if (isLoadingTasks) return;

    if (!forceRefresh && tasks.length > 0 && lastTasksFetch && now - lastTasksFetch < CACHE_DURATION) {
      return;
    }

    set({ isLoadingTasks: true, error: null });

    try {
      const params = new URLSearchParams({ limit: '50' });
      if (preferFirestore) params.set('source', 'firestore');
      const response = await fetchWithAuthRetry(`/api/admin/fetchAllTasks?${params.toString()}`);
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

  fetchAllParticipants: async (forceRefresh = false, search?: string) => {
    const { participants, lastParticipantsFetch, isLoadingParticipants, participantsSearchQuery } = get();
    const now = Date.now();
    // If search is explicitly provided, use it (empty string means clear search); otherwise use stored query
    const searchTerm = search !== undefined ? (search.trim() || undefined) : (participantsSearchQuery?.trim() || undefined);
    const searchQueryToStore = search !== undefined ? search : participantsSearchQuery;

    if (isLoadingParticipants) return;

    const cacheOk = !forceRefresh && participants.length > 0 && lastParticipantsFetch && now - lastParticipantsFetch < CACHE_DURATION && !searchTerm;
    if (cacheOk) return;

    set({ isLoadingParticipants: true, error: null, participantsSearchQuery: searchQueryToStore });

    try {
      let url = '/api/admin/participants?limit=50';
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      const response = await fetchWithAuthRetry(url);
      const { participants: newParticipants, hasMore, nextCursor } = await response.json();
      set({
        participants: newParticipants || [],
        isLoadingParticipants: false,
        lastParticipantsFetch: Date.now(),
        hasMoreParticipants: !!hasMore,
        participantsNextCursor: nextCursor,
      });
    } catch (error) {
      console.error('Error fetching participants:', error);
      set({
        isLoadingParticipants: false,
        error: error instanceof Error ? error.message : 'Failed to fetch participants',
      });
    }
  },

  loadMoreParticipants: async () => {
    const { participantsNextCursor, isLoadingMoreParticipants, hasMoreParticipants, participantsSearchQuery } = get();
    if (!participantsNextCursor || isLoadingMoreParticipants || !hasMoreParticipants) return;

    set({ isLoadingMoreParticipants: true, error: null });

    try {
      let url = `/api/admin/participants?limit=50&startAfterDocId=${encodeURIComponent(participantsNextCursor.startAfterDocId)}`;
      if (participantsSearchQuery) {
        url += `&search=${encodeURIComponent(participantsSearchQuery)}`;
      }
      const response = await fetchWithAuthRetry(url);
      const { participants: moreParticipants, hasMore, nextCursor } = await response.json();
      const currentParticipants = get().participants;
      set({
        participants: [...currentParticipants, ...(moreParticipants || [])],
        isLoadingMoreParticipants: false,
        hasMoreParticipants: !!hasMore,
        participantsNextCursor: nextCursor,
      });
    } catch (error) {
      console.error('Error loading more participants:', error);
      set({
        isLoadingMoreParticipants: false,
        error: error instanceof Error ? error.message : 'Failed to load more participants',
      });
    }
  },

  updateTask: async (taskId: string, data: AdminUpdateTaskData): Promise<boolean> => {
    set({ isUpdating: true, error: null });

    try {
      await fetchWithAuthRetry('/api/admin/updateTask', {
        method: 'PATCH',
        body: JSON.stringify({ taskId, data })
      });

      const currentTasks = get().tasks;
      set({
        tasks: currentTasks.map((t) => {
          if (t.id !== taskId) return t;
          const { deadline: _deadline, ...patch } = data;
          return { ...t, ...patch };
        }),
        isUpdating: false,
      });
      await get().fetchAllTasks(true, true);
      
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

  toggleParticipantStatus: async (participantId: string, disabled: boolean): Promise<boolean> => {
    set({ isTogglingParticipantStatus: true, error: null });

    try {
      await fetchWithAuthRetry('/api/admin/toggleParticipantStatus', {
        method: 'PATCH',
        body: JSON.stringify({ participantId, disabled })
      });

      set({ isTogglingParticipantStatus: false });
      return true;
    } catch (error) {
      console.error('Error toggling participant status:', error);
      set({
        isTogglingParticipantStatus: false,
        error: error instanceof Error ? error.message : 'Failed to toggle participant status'
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
  
  clearCache: () => set({
    tasks: [],
    taskMasters: [],
    participants: [],
    lastTasksFetch: null,
    lastTaskMastersFetch: null,
    lastParticipantsFetch: null,
    hasMoreTasks: false,
    hasMoreTaskMasters: false,
    hasMoreParticipants: false,
    tasksNextCursor: null,
    taskMastersNextCursor: null,
    participantsNextCursor: null,
    participantsSearchQuery: '',
  }),
}));

