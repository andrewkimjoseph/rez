import { useNewTaskStore } from '@/stores/new-task-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Step2TaskDetails() {
  const { data, updateData } = useNewTaskStore();

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title" className="mb-2">Task Title</Label>
        <Input
          id="title"
          value={data.title || ''}
          onChange={e => updateData({ title: e.target.value })}
          placeholder="Enter a title for your task"
        />
      </div>
      <div>
        <Label htmlFor="description" className="mb-2">Description</Label>
        <Input
          id="description"
          value={data.description || ''}
          onChange={e => updateData({ description: e.target.value })}
          placeholder="Describe your task"
        />
      </div>
      <div>
        <Label htmlFor="objective" className="mb-2">Research Objective</Label>
        <Input
          id="objective"
          value={data.objective || ''}
          onChange={e => updateData({ objective: e.target.value })}
          placeholder="What is the main objective?"
        />
      </div>
    </div>
  );
} 