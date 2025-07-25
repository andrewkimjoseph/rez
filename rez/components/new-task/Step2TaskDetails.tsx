import { useNewTaskStore } from '@/stores/new-task-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function Step2TaskDetails() {
  const { data, updateData } = useNewTaskStore();

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title" className="mb-2">Title</Label>
        <Input
          id="title"
          value={data.title || ''}
          onChange={e => updateData({ title: e.target.value })}
          placeholder="Enter a title for your task"
        />
      </div>
      <div>
        <Label htmlFor="category" className="mb-2">Category</Label>
        <Select
          value={data.category || ''}
          onValueChange={value => updateData({ category: value as 'finance' | 'climate' | 'education' })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="climate">Climate</SelectItem>
            <SelectItem value="education">Education</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="difficulty" className="mb-2">Level of Difficulty</Label>
        <Select
          value={data.difficulty || ''}
          onValueChange={value => updateData({ difficulty: value as 'easy' | 'medium' | 'hard' })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
} 