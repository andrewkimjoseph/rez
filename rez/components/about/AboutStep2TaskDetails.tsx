import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function AboutStep2TaskDetails() {
  // Demo version - no functionality, just displays the UI with demo data
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title" className="mb-2">Title</Label>
        <Input
          id="title"
          value="Recycling Habits & Digital Rewards"
          placeholder="e.g. Recycling Habits & Digital Rewards"
          disabled
          className="bg-muted/50 cursor-default"
        />
      </div>
      <div>
        <Label htmlFor="category" className="mb-2">Category</Label>
        <div className="w-full">
          <Select value="Climate" disabled>
            <SelectTrigger className="w-full bg-muted/50 cursor-default opacity-70 pointer-events-none">
              <SelectValue>Climate</SelectValue>
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
      </div>
      <div>
        <Label htmlFor="difficulty" className="mb-2">Level of Difficulty</Label>
        <div className="w-full">
          <Select value="Easy" disabled>
            <SelectTrigger className="w-full bg-muted/50 cursor-default opacity-70 pointer-events-none">
              <SelectValue>Easy</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-4 italic">
        💡 Fill in the task details. Title, category, and difficulty are required fields.
      </p>
    </div>
  );
}