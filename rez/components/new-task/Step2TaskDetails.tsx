import { useNewTaskStore } from '@/stores/new-task-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  CheckCircleIcon,
  PencilSquareIcon,
  TagIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

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
  { value: 'Easy', label: 'Easy', description: '5-10 minutes' },
  { value: 'Medium', label: 'Medium', description: '10-20 minutes' },
  { value: 'Hard', label: 'Hard', description: '20+ minutes' },
];

export default function Step2TaskDetails() {
  const { data, updateData } = useNewTaskStore();

  const titleMaxLength = 100;
  const titleLength = data.title?.length || 0;

  const isFieldComplete = (field: string | undefined) => !!field && field.length > 0;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Tell us about your task</h2>
        <p className="text-sm text-gray-500 mt-0.5">Provide details to help users understand what they&apos;ll be doing</p>
      </div>

      <div className="space-y-4">
        {/* Title Field */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PencilSquareIcon className="w-4 h-4 text-gray-400" />
              <Label htmlFor="title" className="text-sm font-medium">Task Title</Label>
              {isFieldComplete(data.title) && (
                <CheckCircleSolidIcon className="w-4 h-4 text-green-500" />
              )}
            </div>
            <span className={`text-xs ${titleLength > titleMaxLength * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
              {titleLength}/{titleMaxLength}
            </span>
          </div>
          <Input
            id="title"
            value={data.title || ''}
            onChange={e => updateData({ title: e.target.value.slice(0, titleMaxLength) })}
            placeholder="e.g. Recycling Habits & Digital Rewards"
            className={`transition-all duration-200 ${
              isFieldComplete(data.title)
                ? 'border-green-200 focus:border-green-400 focus:ring-green-100'
                : ''
            }`}
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Choose a clear, descriptive title that explains what users will do
          </p>
        </div>

        {/* Category Field */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TagIcon className="w-4 h-4 text-gray-400" />
            <Label htmlFor="category" className="text-sm font-medium">Category</Label>
            {isFieldComplete(data.category) && (
              <CheckCircleSolidIcon className="w-4 h-4 text-green-500" />
            )}
          </div>
          <Select
            value={data.category || ''}
            onValueChange={value => updateData({ category: value as 'Finance' | 'Climate' | 'Education' | 'Health' | 'Technology' | 'Social' | 'Other'})}
          >
            <SelectTrigger className={`w-full transition-all duration-200 ${
              isFieldComplete(data.category)
                ? 'border-green-200 focus:border-green-400'
                : ''
            }`}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400 mt-1.5">
            This helps users find tasks that match their interests
          </p>
        </div>

        {/* Difficulty Field */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="w-4 h-4 text-gray-400" />
            <Label htmlFor="difficulty" className="text-sm font-medium">Difficulty Level</Label>
            {isFieldComplete(data.difficulty) && (
              <CheckCircleSolidIcon className="w-4 h-4 text-green-500" />
            )}
          </div>
          <Select
            value={data.difficulty || ''}
            onValueChange={value => updateData({ difficulty: value as 'Easy' | 'Medium' | 'Hard' })}
          >
            <SelectTrigger className={`w-full transition-all duration-200 ${
              isFieldComplete(data.difficulty)
                ? 'border-green-200 focus:border-green-400'
                : ''
            }`}>
              <SelectValue placeholder="Select difficulty level" />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((difficulty) => (
                <SelectItem key={difficulty.value} value={difficulty.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{difficulty.label}</span>
                    <span className="text-xs text-gray-400 ml-2">({difficulty.description})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400 mt-1.5">
            Estimate how long and complex this task will be for users
          </p>
        </div>

        {/* Completion status */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {[data.title, data.category, data.difficulty].filter(Boolean).length === 3 ? (
              <>
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-600 font-medium">All fields completed</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  {[data.title, data.category, data.difficulty].map((field, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full ${field ? 'bg-green-500' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {[data.title, data.category, data.difficulty].filter(Boolean).length} of 3 fields completed
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
