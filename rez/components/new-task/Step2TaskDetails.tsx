import { useNewTaskStore } from '@/stores/new-task-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { InformationCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { isFieldRejected, getRejectionReasonsForField } from '@/utils/rejection-highlighting';
import { getRejectionReasonLabel } from '@/utils/rejection-reasons';
import { TOOLTIP_TEXTS } from '@/data/tooltip-texts';

const categories = [
  { value: 'Finance', label: 'Finance' },
  { value: 'Climate', label: 'Climate' },
  { value: 'Education', label: 'Education' },
  { value: 'Health', label: 'Health' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Social', label: 'Social' },
  { value: 'Other', label: 'Other' },
];

const difficulties = [
  { value: 'Easy', label: 'Easy', description: '5–10 min' },
  { value: 'Medium', label: 'Medium', description: '10–20 min' },
  { value: 'Hard', label: 'Hard', description: '20+ min' },
];

export default function Step2TaskDetails() {
  const { data, updateData, editMode, editingTaskReasons, hasFieldChanged } = useNewTaskStore();

  const titleMaxLength = 100;
  const titleLength = data.title?.length || 0;
  
  const titleWasRejected = editMode && isFieldRejected('title', editingTaskReasons, data.type || null);
  const titleHasChanged = hasFieldChanged('title');
  const isTitleRejected = titleWasRejected && !titleHasChanged;
  const titleRejectionReasons = editMode && editingTaskReasons 
    ? getRejectionReasonsForField('title', editingTaskReasons, data.type || null)
    : [];

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
              {data.title && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="What should the task title be?">
                      <InformationCircleIcon className="w-3.5 h-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    {TOOLTIP_TEXTS.title}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className={`text-[10px] ${titleLength > titleMaxLength * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
              {titleLength}/{titleMaxLength}
            </span>
          </div>
          <div className="relative">
            <Input
              id="title"
              value={data.title || ''}
              onChange={e => updateData({ title: e.target.value.slice(0, titleMaxLength) })}
              placeholder="e.g. Recycling Habits & Digital Rewards"
              className={`h-9 text-sm ${isTitleRejected ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {isTitleRejected && (
              <div className="mt-1.5 flex items-start gap-1.5">
                <ExclamationCircleIcon className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 mb-1">
                    Rejected
                  </Badge>
                  <p className="text-[11px] text-red-600">
                    {titleRejectionReasons.map(getRejectionReasonLabel).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Label htmlFor="category" className="text-xs font-medium text-gray-500">Category</Label>
              {data.category && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="What category is this task?">
                      <InformationCircleIcon className="w-3.5 h-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    {TOOLTIP_TEXTS.category}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={data.category || ''}
              onValueChange={value => updateData({ category: value as 'Finance' | 'Climate' | 'Education' | 'Health' | 'Technology' | 'Social' | 'Other'})}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Label htmlFor="difficulty" className="text-xs font-medium text-gray-500">Difficulty</Label>
              {data.difficulty && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="How difficult is this task?">
                      <InformationCircleIcon className="w-3.5 h-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    {TOOLTIP_TEXTS.difficulty}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={data.difficulty || ''}
              onValueChange={value => updateData({ difficulty: value as 'Easy' | 'Medium' | 'Hard' })}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty.value} value={difficulty.value}>
                    <span>{difficulty.label}</span>
                    <span className="text-gray-400 ml-1 text-xs">({difficulty.description})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
