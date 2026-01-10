import { Card } from '@/components/ui/card';
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
    title: 'Fill a Form',
    description: 'Users fill out forms or surveys to provide feedback and data',
    icon: ClipboardDocumentListIcon,
    available: true,
    selected: true,
  },
  {
    id: 'checkOutApp',
    title: 'Check Out App',
    description: 'Users test and explore mobile or web applications',
    icon: DevicePhoneMobileIcon,
    available: true,
    selected: false,
  },
  {
    id: 'doVideoInterview',
    title: 'Video Interview',
    description: 'Users participate in video interviews for qualitative research',
    icon: VideoCameraIcon,
    available: false,
    selected: false,
  },
];

export default function AboutStep1TaskType() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">What type of task do you want to create?</h2>
        <p className="text-sm text-gray-500 mt-0.5">Select the task type that best fits your research needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {taskTypes.map((taskType) => {
          const IconComponent = taskType.icon;

          if (!taskType.available) {
            return (
              <Card
                key={taskType.id}
                className="relative p-4 border-2 border-gray-100 bg-gray-50/50 cursor-not-allowed"
              >
                <Badge className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-500 text-white text-xs">
                  Coming Soon
                </Badge>

                <div className="flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                    <IconComponent className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-400 mb-1 text-sm">{taskType.title}</h3>
                  <p className="text-xs text-gray-400">{taskType.description}</p>
                </div>
              </Card>
            );
          }

          return (
            <Card
              key={taskType.id}
              className={`relative p-4 cursor-default border-2 ${
                taskType.selected
                  ? 'border-[#5C29A3] bg-[#5C29A3]/5 shadow-md'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {taskType.selected && (
                <div className="absolute top-2 right-2">
                  <CheckCircleIcon className="w-5 h-5 text-[#5C29A3]" />
                </div>
              )}

              <div className="flex flex-col items-center text-center">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-2 ${
                  taskType.selected
                    ? 'bg-[#5C29A3] text-white'
                    : 'bg-[#5C29A3]/10 text-[#5C29A3]'
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>

                <h3 className={`font-semibold mb-1 text-sm ${
                  taskType.selected ? 'text-[#5C29A3]' : 'text-gray-900'
                }`}>
                  {taskType.title}
                </h3>

                <p className="text-xs text-gray-500">{taskType.description}</p>

                <div className={`mt-2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  taskType.selected
                    ? 'border-[#5C29A3] bg-[#5C29A3]'
                    : 'border-gray-300'
                }`}>
                  {taskType.selected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground mt-4 italic">
        Click on a task type to select it. In this example, &quot;Fill a Form&quot; is selected.
      </p>
    </div>
  );
}
