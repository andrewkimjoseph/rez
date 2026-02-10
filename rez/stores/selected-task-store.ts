import { create } from 'zustand';
import { Task } from '@/firebase/firestore/models/Task';
import { getTokenInfo, TokenInfo } from '@/utils/currencies';

export interface FormattedTaskData {
  // Basic Info
  id: string;
  title: string;
  type: string;
  typeLabel: string;
  category: string;
  levelOfDifficulty: string;
  targetCountry: string;

  // Content
  link: string;
  instructions: string;
  feedback: string;
  paymentTerms: string;

  // Rewards
  targetNumberOfParticipants: number;
  rewardAmountPerParticipant: number;
  rewardCurrencyId: number;
  tokenInfo: TokenInfo | null;
  formattedReward: string;
  managerContractAddress: string;
  blockscoutUrl: string;

  // Settings
  estimatedTimeOfCompletionInMinutes: number;
  numberOfCooldownHours: number;
  isAvailable: boolean;
  isTest: boolean;

  // Metadata
  taskMasterId: string;
  rezTaskMasterEmailAddress: string;
  timeCreated: string;
  timeUpdated: string;
}

interface SelectedTaskStore {
  task: Task | null;
  formattedData: FormattedTaskData | null;
  setTask: (task: Task | null) => void;
  clearTask: () => void;
}

const getTaskTypeLabel = (type: string | null | undefined): string => {
  switch (type) {
    case 'fillAForm': return 'Fill a Form';
    case 'checkOutApp': return 'Check Out App';
    case 'doVideoInterview': return 'Video Interview';
    default: return type || 'Unknown';
  }
};

const formatTimestamp = (timestamp: unknown): string => {
  if (!timestamp) return 'N/A';
  try {
    const ts = timestamp as { seconds?: number; _seconds?: number };
    const seconds = ts.seconds || ts._seconds;
    if (seconds) {
      return new Date(seconds * 1000).toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return 'N/A';
  } catch {
    return 'N/A';
  }
};

const formatTaskData = (task: Task): FormattedTaskData => {
  const tokenInfo = getTokenInfo(task.rewardCurrencyId);
  const amount = task.rewardAmountPerParticipant || 0;
  const formattedReward = tokenInfo
    ? `${tokenInfo.symbol} ${amount}`
    : `$${amount}`;

  const managerContractAddress = task.managerContractAddress || '';
  const blockscoutUrl = managerContractAddress
    ? `https://celoscan.io/address/${managerContractAddress}`
    : '';

  return {
    // Basic Info
    id: task.id || '',
    title: task.title || 'Untitled Task',
    type: task.type || '',
    typeLabel: getTaskTypeLabel(task.type),
    category: task.category || 'N/A',
    levelOfDifficulty: task.levelOfDifficulty || 'N/A',
    targetCountry: task.targetCountry || 'ALL',

    // Content
    link: task.link || '',
    instructions: task.instructions || '',
    feedback: task.feedback || '',
    paymentTerms: task.paymentTerms || '',

    // Rewards
    targetNumberOfParticipants: task.targetNumberOfParticipants || 0,
    rewardAmountPerParticipant: task.rewardAmountPerParticipant || 0,
    rewardCurrencyId: task.rewardCurrencyId || 0,
    tokenInfo,
    formattedReward,
    managerContractAddress,
    blockscoutUrl,

    // Settings
    estimatedTimeOfCompletionInMinutes: task.estimatedTimeOfCompletionInMinutes || 0,
    numberOfCooldownHours: task.numberOfCooldownHours || 0,
    isAvailable: task.isAvailable || false,
    isTest: task.isTest || false,

    // Metadata
    taskMasterId: task.taskMasterId || '',
    rezTaskMasterEmailAddress: task.rezTaskMasterEmailAddress || 'N/A',
    timeCreated: formatTimestamp(task.timeCreated),
    timeUpdated: formatTimestamp(task.timeUpdated),
  };
};

export const useSelectedTaskStore = create<SelectedTaskStore>()((set) => ({
  task: null,
  formattedData: null,

  setTask: (task) => {
    if (task) {
      set({
        task,
        formattedData: formatTaskData(task)
      });
    } else {
      set({ task: null, formattedData: null });
    }
  },

  clearTask: () => set({ task: null, formattedData: null }),
}));
