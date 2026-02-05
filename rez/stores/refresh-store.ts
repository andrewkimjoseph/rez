import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RefreshTracker {
  lastRefreshTime: number;
  canRefresh: boolean;
  timeRemaining: number; // in minutes
  timeRemainingSeconds: number; // in seconds
  formattedTime: string; // "25m 30s" format
}

interface RefreshStore {
  globalLastRefreshTime: number;
  updateRefreshTime: () => void;
  checkCanRefresh: () => RefreshTracker;
  getTimeRemaining: () => number;
}

const COOLDOWN_MINUTES = 3;
const COOLDOWN_MS = COOLDOWN_MINUTES * 60 * 1000;

export const useRefreshStore = create<RefreshStore>()(
  persist(
    (set, get) => ({
      globalLastRefreshTime: 0,

      updateRefreshTime: () => {
        const now = Date.now();
        set(() => ({
          globalLastRefreshTime: now,
        }));
      },

      checkCanRefresh: () => {
        const state = get();
        const now = Date.now();
        const timeSinceLastRefresh = now - state.globalLastRefreshTime;
        
        if (timeSinceLastRefresh >= COOLDOWN_MS || state.globalLastRefreshTime === 0) {
          return {
            lastRefreshTime: state.globalLastRefreshTime,
            canRefresh: true,
            timeRemaining: 0,
            timeRemainingSeconds: 0,
            formattedTime: '',
          };
        } else {
          const timeRemainingMs = COOLDOWN_MS - timeSinceLastRefresh;
          const timeRemainingMinutes = Math.floor(timeRemainingMs / (60 * 1000));
          const timeRemainingSeconds = Math.floor((timeRemainingMs % (60 * 1000)) / 1000);
          const totalSeconds = Math.floor(timeRemainingMs / 1000);
          
          // Format time string
          let formattedTime = '';
          if (timeRemainingMinutes > 0) {
            formattedTime = `${timeRemainingMinutes}m ${timeRemainingSeconds}s`;
          } else {
            formattedTime = `${timeRemainingSeconds}s`;
          }
          
          return {
            lastRefreshTime: state.globalLastRefreshTime,
            canRefresh: false,
            timeRemaining: timeRemainingMinutes,
            timeRemainingSeconds: totalSeconds,
            formattedTime,
          };
        }
      },

      getTimeRemaining: () => {
        const refreshData = get().checkCanRefresh();
        return refreshData.timeRemaining;
      },
    }),
    {
      name: 'refresh-storage',
      partialize: (state) => ({ 
        globalLastRefreshTime: state.globalLastRefreshTime
      }),
    }
  )
);