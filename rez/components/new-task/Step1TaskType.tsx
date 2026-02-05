import { useNewTaskStore } from '@/stores/new-task-store';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardDocumentListIcon,
  DevicePhoneMobileIcon,
  VideoCameraIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const taskTypes = [
  {
    id: 'fillAForm',
    title: 'Online Survey',
    description: 'Users fill out forms or surveys',
    icon: ClipboardDocumentListIcon,
    available: true,
  },
  {
    id: 'checkOutApp',
    title: 'Product Testing',
    description: 'Users test mobile or web apps',
    icon: DevicePhoneMobileIcon,
    available: true,
  },
  {
    id: 'doVideoInterview',
    title: 'Video Interview',
    description: 'Qualitative video research',
    icon: VideoCameraIcon,
    available: false,
  },
];

export default function Step1TaskType() {
  const { data: { type }, updateData } = useNewTaskStore();

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Task type</h2>
        <p className="text-sm text-gray-500 mt-0.5">Choose the type that fits your research</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {taskTypes.map((taskType) => {
          const isSelected = type === taskType.id;
          const IconComponent = taskType.icon;

          if (!taskType.available) {
            return (
              <div
                key={taskType.id}
                className="relative p-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-not-allowed"
              >
                <Badge className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-500 text-white text-[10px] px-1.5 py-0">
                  Soon
                </Badge>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-400 text-sm">{taskType.title}</h3>
                    <p className="text-xs text-gray-400">{taskType.description}</p>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <button
              type="button"
              key={taskType.id}
              className={`relative p-3 rounded-xl border text-left transition-all duration-150 ${
                isSelected
                  ? 'border-[#5C29A3] bg-[#5C29A3]/5'
                  : 'border-gray-200 hover:border-[#5C29A3]/40 bg-white hover:bg-gray-50/50'
              }`}
              onClick={() => updateData({ type: taskType.id as 'fillAForm' | 'checkOutApp' | 'doVideoInterview' })}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#5C29A3]" />
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-[#5C29A3] text-white' : 'bg-[#5C29A3]/10 text-[#5C29A3]'
                }`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={`font-medium text-sm ${isSelected ? 'text-[#5C29A3]' : 'text-gray-900'}`}>
                    {taskType.title}
                  </h3>
                  <p className="text-xs text-gray-500">{taskType.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
