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
          placeholder="e.g. Recycling Habits & Digital Rewards"
        />
      </div>
      <div>
        <Label htmlFor="category" className="mb-2">Category</Label>
        <Select
          value={data.category || ''}
          onValueChange={value => updateData({ category: value as 'Finance' | 'Climate' | 'Education' })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="e.g. Finance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Climate">Climate</SelectItem>
            <SelectItem value="Education">Education</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="difficulty" className="mb-2">Level of Difficulty</Label>
        <Select
          value={data.difficulty || ''}
          onValueChange={value => updateData({ difficulty: value as 'Easy' | 'Medium' | 'Hard' })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="e.g. Easy" />
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