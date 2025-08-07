import { useNewTaskStore } from '@/stores/new-task-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Step4QuestionsTasks() {
  const { data, updateData } = useNewTaskStore();

  return (
    <div className="space-y-4">
      <Label htmlFor="tallyFormUrl">Tally Form URL</Label>
      <Input
        id="tallyFormUrl"
        value={data.tallyFormUrl || ''}
        onChange={e => updateData({ tallyFormUrl: e.target.value })}
        placeholder="Paste your Tally form URL here"
      />
      <div className="text-xs text-muted-foreground mt-1">
        Only links generated from Tally forms will be accepted.
      </div>
    </div>
  );
} 