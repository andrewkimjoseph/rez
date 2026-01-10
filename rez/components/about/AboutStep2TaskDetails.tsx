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

export default function AboutStep2TaskDetails() {
  // Demo data
  const demoData = {
    title: 'Recycling Habits & Digital Rewards',
    category: 'Climate',
    difficulty: 'Easy',
  };

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
              <CheckCircleSolidIcon className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-xs text-gray-400">
              {demoData.title.length}/100
            </span>
          </div>
          <Input
            id="title"
            value={demoData.title}
            disabled
            className="bg-muted/50 border-green-200"
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
            <CheckCircleSolidIcon className="w-4 h-4 text-green-500" />
          </div>
          <Select value={demoData.category} disabled>
            <SelectTrigger className="w-full bg-muted/50 border-green-200 opacity-70 pointer-events-none">
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
          <p className="text-xs text-gray-400 mt-1.5">
            This helps users find tasks that match their interests
          </p>
        </div>

        {/* Difficulty Field */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="w-4 h-4 text-gray-400" />
            <Label htmlFor="difficulty" className="text-sm font-medium">Difficulty Level</Label>
            <CheckCircleSolidIcon className="w-4 h-4 text-green-500" />
          </div>
          <Select value={demoData.difficulty} disabled>
            <SelectTrigger className="w-full bg-muted/50 border-green-200 opacity-70 pointer-events-none">
              <SelectValue>{demoData.difficulty}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Easy">Easy (5-10 minutes)</SelectItem>
              <SelectItem value="Medium">Medium (10-20 minutes)</SelectItem>
              <SelectItem value="Hard">Hard (20+ minutes)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400 mt-1.5">
            Estimate how long and complex this task will be for users
          </p>
        </div>

        {/* Completion status */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-600 font-medium">All fields completed</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-4 italic">
        Fill in the task details. Title, category, and difficulty are required fields.
      </p>
    </div>
  );
}
