import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task } from '@/firebase/firestore/models/Task';
import { TaskCompletion } from '@/firebase/firestore/models/TaskCompletion';
import { useTaskMasterStore } from './taskmaster-store';

interface TasksStore {
  tasks: Task[];
  taskCompletions: TaskCompletion[];
  isLoading: boolean;
  isDeleting: boolean;
  error: string | null;
  fetchTasksAndCompletions: () => Promise<void>;
  deleteTask: (taskId: string) => Promise<boolean>;
  setTasks: (tasks: Task[]) => void;
  setTaskCompletions: (taskCompletions: TaskCompletion[]) => void;
  clearTasksAndCompletions: () => void;
}

export const useTasksStore = create<TasksStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      taskCompletions: [],
      isLoading: false,
      isDeleting: false,
      error: null,

      fetchTasksAndCompletions: async () => {
        const taskMaster = useTaskMasterStore.getState().user;
        
        if (!taskMaster?.emailAddress) {
          set({ 
            tasks: [], 
            taskCompletions: [], 
            error: 'No valid taskMaster email address found' 
          });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Fetch tasks
          const tasksResponse = await fetch(
            `/api/fetchAllTasksForRezTaskMaster?rezTaskMasterEmailAddress=${encodeURIComponent(taskMaster.emailAddress)}`
          );
          
          if (!tasksResponse.ok) {
            throw new Error('Failed to fetch tasks');
          }
          
          const tasksData = await tasksResponse.json();
          const tasks: Task[] = tasksData.tasks || [];

          // Fetch task completions
          const completionsResponse = await fetch(
            `/api/fetchAllTaskCompletionsForRezTaskMaster?rezTaskMasterEmailAddress=${encodeURIComponent(taskMaster.emailAddress)}`
          );
          
          if (!completionsResponse.ok) {
            throw new Error('Failed to fetch task completions');
          }
          
          const completionsData = await completionsResponse.json();
          const taskCompletions: TaskCompletion[] = completionsData.taskCompletions || [];

          set({ 
            tasks, 
            taskCompletions, 
            isLoading: false, 
            error: null 
          });
        } catch (error) {
          console.error('Error fetching tasks and completions:', error);
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to fetch data' 
          });
        }
      },

      deleteTask: async (taskId: string): Promise<boolean> => {
        const taskMaster = useTaskMasterStore.getState().user;
        
        if (!taskMaster?.emailAddress) {
          set({ error: 'No valid taskMaster email address found' });
          return false;
        }

        set({ isDeleting: true, error: null });

        try {
          const response = await fetch(
            `/api/deleteTask?taskId=${encodeURIComponent(taskId)}&rezTaskMasterEmailAddress=${encodeURIComponent(taskMaster.emailAddress)}`,
            { method: 'DELETE' }
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete task');
          }

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

      setTasks: (tasks: Task[]) => set({ tasks }),
      
      setTaskCompletions: (taskCompletions: TaskCompletion[]) => set({ taskCompletions }),
      
      clearTasksAndCompletions: () => set({ 
        tasks: [], 
        taskCompletions: [], 
        error: null 
      }),
    }),
    {
      name: 'tasks-storage',
      partialize: (state) => ({ 
        tasks: state.tasks, 
        taskCompletions: state.taskCompletions 
      }),
    }
  )
); 