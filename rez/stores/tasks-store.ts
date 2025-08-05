import { create } from 'zustand';
import { Task } from '@/firebase/firestore/models/Task';
import { TaskCompletion } from '@/firebase/firestore/models/TaskCompletion';
import { useTaskMasterStore } from './taskmaster-store';

interface TasksStore {
  tasks: Task[];
  taskCompletions: TaskCompletion[];
  isLoading: boolean;
  error: string | null;
  fetchTasksAndCompletions: () => Promise<void>;
  setTasks: (tasks: Task[]) => void;
  setTaskCompletions: (taskCompletions: TaskCompletion[]) => void;
  clearTasksAndCompletions: () => void;
}

export const useTasksStore = create<TasksStore>((set, get) => ({
  tasks: [],
  taskCompletions: [],
  isLoading: false,
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

  setTasks: (tasks: Task[]) => set({ tasks }),
  
  setTaskCompletions: (taskCompletions: TaskCompletion[]) => set({ taskCompletions }),
  
  clearTasksAndCompletions: () => set({ 
    tasks: [], 
    taskCompletions: [], 
    error: null 
  }),
})); 