import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

export default function AboutStep2TaskDetails() {
  // Demo data
  const demoData = {
    title: 'Recycling Habits & Digital Rewards',
    category: 'Climate',
    difficulty: 'Easy',
  };

  const titleMaxLength = 100;
  const titleLength = demoData.title.length;

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Task details</h2>
        <p className="text-sm text-gray-500 mt-0.5">Title, category, and difficulty</p>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="title" className="text-xs font-medium text-gray-500">Title</Label>
              <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="What should the task title be?">
                      <InformationCircleIcon className="w-3.5 h-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    A clear, descriptive title that explains what users will do. This helps participants understand the task before starting.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className={`text-[10px] ${titleLength > titleMaxLength * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
              {titleLength}/{titleMaxLength}
            </span>
          </div>
          <Input
            id="title"
            value={demoData.title}
            disabled
            className="h-9 text-sm bg-muted/50 border-green-200"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Label htmlFor="category" className="text-xs font-medium text-gray-500">Category</Label>
              <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="What category is this task?">
                      <InformationCircleIcon className="w-3.5 h-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    Select the category that best matches your task. This helps users find tasks that match their interests.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={demoData.category} disabled>
              <SelectTrigger className="h-9 text-sm bg-muted/50 border-green-200">
                <SelectValue>{demoData.category}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Climate">Climate</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Social">Social</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Label htmlFor="difficulty" className="text-xs font-medium text-gray-500">Difficulty</Label>
              <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="How difficult is this task?">
                      <InformationCircleIcon className="w-3.5 h-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    Estimate how long and complex this task will be for users. Easy (5-10 min), Medium (10-20 min), or Hard (20+ min).
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={demoData.difficulty} disabled>
              <SelectTrigger className="h-9 text-sm bg-muted/50 border-green-200">
                <SelectValue>{demoData.difficulty}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">
                  <span>Easy</span>
                  <span className="text-gray-400 ml-1 text-xs">(5–10 min)</span>
                </SelectItem>
                <SelectItem value="Medium">
                  <span>Medium</span>
                  <span className="text-gray-400 ml-1 text-xs">(10–20 min)</span>
                </SelectItem>
                <SelectItem value="Hard">
                  <span>Hard</span>
                  <span className="text-gray-400 ml-1 text-xs">(20+ min)</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
