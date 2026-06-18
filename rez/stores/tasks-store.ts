import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchWithAuthRetry } from '@/lib/api-fetch';
import { Task } from '@/firebase/firestore/models/Task';
import { TaskCompletion } from '@/firebase/firestore/models/TaskCompletion';
import { useTaskMasterStore } from './taskmaster-store';

export interface EditTaskData {
  title?: string;
  type?: 'fillAForm' | 'checkOutApp' | 'doVideoInterview' | 'answerPoll';
  category?: string;
  levelOfDifficulty?: string;
  link?: string;
  instructions?: string;
  feedback?: string;
  targetCountry?: string;
  rewardCurrencyId?: number;
  rewardAmountPerParticipant?: number;
}

// Skip API call if data was fetched within this window (unless forceRefresh)
const FETCH_TTL_MS = 15 * 60 * 1000; // 15 minutes

let tasksFetchInFlight: Promise<void> | null = null;
let tasksListFetchInFlight: Promise<void> | null = null;

async function runDeduped(
  slot: 'full' | 'list',
  fn: () => Promise<void>,
): Promise<void> {
  const inFlight = slot === 'full' ? tasksFetchInFlight : tasksListFetchInFlight;
  if (inFlight) {
    await inFlight;
    return;
  }

  const promise = fn().finally(() => {
    if (slot === 'full') tasksFetchInFlight = null;
    else tasksListFetchInFlight = null;
  });

  if (slot === 'full') tasksFetchInFlight = promise;
  else tasksListFetchInFlight = promise;

  await promise;
}

export interface CompletionStats {
  totalCount: number;
  validated: number;
  invalidated: number;
  expired: number;
  pending: number;
  claimed: number;
}

interface TasksStore {
  tasks: Task[];
  taskCompletions: TaskCompletion[];
  completionStats: CompletionStats | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isDeleting: boolean;
  isUpdatingStatus: boolean;
  isEditing: boolean;
  error: string | null;
  lastTasksFetchedAt: number | null;
  fetchTasksAndCompletions: (forceRefresh?: boolean) => Promise<void>;
  fetchTasksForList: (forceRefresh?: boolean) => Promise<void>;
  prependTask: (task: Task) => void;
  deleteTask: (taskId: string) => Promise<boolean>;
  updateTaskStatus: (taskId: string, isAvailable: boolean) => Promise<boolean>;
  editTask: (taskId: string, data: EditTaskData) => Promise<boolean>;
  setTasks: (tasks: Task[]) => void;
  setTaskCompletions: (taskCompletions: TaskCompletion[]) => void;
  clearTasksAndCompletions: () => void;
}

export const useTasksStore = create<TasksStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      taskCompletions: [],
      completionStats: null,
      isLoading: false,
      isRefreshing: false,
      isDeleting: false,
      isUpdatingStatus: false,
      isEditing: false,
      error: null,
      lastTasksFetchedAt: null,

      fetchTasksAndCompletions: async (forceRefresh = false) => {
        await runDeduped('full', async () => {
          const taskMaster = useTaskMasterStore.getState().user;

          if (!taskMaster?.emailAddress) {
            set({
              tasks: [],
              taskCompletions: [],
              completionStats: null,
              error: 'No valid taskMaster email address found',
            });
            return;
          }

          const { lastTasksFetchedAt } = get();
          const now = Date.now();
          if (!forceRefresh && lastTasksFetchedAt != null && (now - lastTasksFetchedAt) < FETCH_TTL_MS) {
            return;
          }

          const hasCachedTasks = get().tasks.length > 0;
          set({
            isLoading: !hasCachedTasks,
            isRefreshing: hasCachedTasks,
            error: null,
          });

          try {
            const response = await fetchWithAuthRetry('/api/fetchTasksAndCompletionsForRezTaskMaster');
            const data = await response.json();

            set({
              tasks: data.tasks || [],
              taskCompletions: data.taskCompletions || [],
              completionStats: data.completionStats ?? null,
              isLoading: false,
              isRefreshing: false,
              error: null,
              lastTasksFetchedAt: Date.now(),
            });
          } catch (error) {
            console.error('Error fetching tasks and completions:', error);
            set({
              isLoading: false,
              isRefreshing: false,
              error: error instanceof Error ? error.message : 'Failed to fetch data',
            });
          }
        });
      },

      fetchTasksForList: async (forceRefresh = false) => {
        await runDeduped('list', async () => {
          const taskMaster = useTaskMasterStore.getState().user;

          if (!taskMaster?.emailAddress) {
            set({
              tasks: [],
              error: 'No valid taskMaster email address found',
            });
            return;
          }

          const { lastTasksFetchedAt } = get();
          const now = Date.now();
          if (!forceRefresh && lastTasksFetchedAt != null && (now - lastTasksFetchedAt) < FETCH_TTL_MS) {
            return;
          }

          const hasCachedTasks = get().tasks.length > 0;
          set({
            isLoading: !hasCachedTasks,
            isRefreshing: hasCachedTasks,
            error: null,
          });

          try {
            const response = await fetchWithAuthRetry(
              '/api/fetchTasksAndCompletionsForRezTaskMaster?scope=list',
            );
            const data = await response.json();

            set({
              tasks: data.tasks || [],
              isLoading: false,
              isRefreshing: false,
              error: null,
              lastTasksFetchedAt: Date.now(),
            });
          } catch (error) {
            console.error('Error fetching tasks list:', error);
            set({
              isLoading: false,
              isRefreshing: false,
              error: error instanceof Error ? error.message : 'Failed to fetch tasks',
            });
          }
        });
      },

      prependTask: (task: Task) => {
        set((state) => ({
          tasks: [
            task,
            ...state.tasks.filter((existing) => existing.id !== task.id),
          ],
        }));
      },

      deleteTask: async (taskId: string): Promise<boolean> => {
        const taskMaster = useTaskMasterStore.getState().user;
        
        if (!taskMaster?.emailAddress) {
          set({ error: 'No valid taskMaster email address found' });
          return false;
        }

        set({ isDeleting: true, error: null });

        try {
          await fetchWithAuthRetry(
            `/api/deleteTask?taskId=${encodeURIComponent(taskId)}`,
            { method: 'DELETE' }
          );

          // Remove the task from local state
          const currentTasks = get().tasks;
          const updatedTasks = currentTasks.filter(task => task.id !== taskId);
          
          // Also remove associated task completions
          const currentCompletions = get().taskCompletions;
          const updatedCompletions = currentCompletions.filter(
            completion => completion.taskId !== taskId
          );

          set({ 
            tasks: updatedTasks,
            taskCompletions: updatedCompletions,
            isDeleting: false, 
            error: null 
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

      updateTaskStatus: async (taskId: string, isAvailable: boolean): Promise<boolean> => {
        const taskMaster = useTaskMasterStore.getState().user;
        
        if (!taskMaster?.emailAddress) {
          set({ error: 'No valid taskMaster email address found' });
          return false;
        }

        set({ isUpdatingStatus: true, error: null });

        try {
          await fetchWithAuthRetry('/api/updateTaskStatus', {
            method: 'PATCH',
            body: JSON.stringify({
              taskId,
              isAvailable,
            }),
          });

          // Update the task in local state
          const currentTasks = get().tasks;
          const updatedTasks = currentTasks.map(task => 
            task.id === taskId ? { ...task, isAvailable } : task
          );

          set({ 
            tasks: updatedTasks,
            isUpdatingStatus: false, 
            error: null 
          });

          return true;
        } catch (error) {
          console.error('Error updating task status:', error);
          set({ 
            isUpdatingStatus: false, 
            error: error instanceof Error ? error.message : 'Failed to update task status' 
          });
          return false;
        }
      },

      editTask: async (taskId: string, data: EditTaskData): Promise<boolean> => {
        const taskMaster = useTaskMasterStore.getState().user;
        
        if (!taskMaster?.emailAddress) {
          set({ error: 'No valid taskMaster email address found' });
          return false;
        }

        set({ isEditing: true, error: null });

        try {
          await fetchWithAuthRetry('/api/updateTask', {
            method: 'PATCH',
            body: JSON.stringify({
              taskId,
              data,
            }),
          });

          // Update the task in local state
          const currentTasks = get().tasks;
          const updatedTasks = currentTasks.map(task => 
            task.id === taskId ? { ...task, ...data } : task
          );

          set({ 
            tasks: updatedTasks,
            isEditing: false, 
            error: null 
          });

          return true;
        } catch (error) {
          console.error('Error editing task:', error);
          set({ 
            isEditing: false, 
            error: error instanceof Error ? error.message : 'Failed to edit task' 
          });
          return false;
        }
      },

      setTasks: (tasks: Task[]) => set({ tasks }),
      
      setTaskCompletions: (taskCompletions: TaskCompletion[]) => set({ taskCompletions }),
      
      clearTasksAndCompletions: () => set({ 
        tasks: [], 
        taskCompletions: [], 
        completionStats: null,
        error: null 
      }),
    }),
    {
      name: 'tasks-storage',
      partialize: (state) => ({ 
        tasks: state.tasks, 
        taskCompletions: state.taskCompletions,
        completionStats: state.completionStats,
        lastTasksFetchedAt: state.lastTasksFetchedAt,
      }),
    }
  )
); 