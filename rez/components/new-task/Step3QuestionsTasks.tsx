import { useNewTaskStore } from '@/stores/new-task-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function Step4QuestionsTasks() {
  const { data, updateData } = useNewTaskStore();

  const getLinkLabel = () => {
    if (data.type === 'fillAForm') return 'Link to form';
    if (data.type === 'checkOutApp') return 'Link to product';
    return 'Link';
  };

  const getLinkPlaceholder = () => {
    if (data.type === 'fillAForm') return 'Paste your form URL here';
    if (data.type === 'checkOutApp') return 'Paste your product/app URL here';
    return 'Paste the URL here';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="link">{getLinkLabel()}</Label>
        <Input
          id="link"
          value={data.link || ''}
          onChange={e => updateData({ link: e.target.value })}
          placeholder={getLinkPlaceholder()}
        />
      </div>

      {data.type === 'checkOutApp' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={data.instructions || ''}
              onChange={e => updateData({ instructions: e.target.value })}
              placeholder="Enter instructions for users on how to complete this task..."
              rows={4}
            />
            <div className="text-xs text-muted-foreground">
              Provide clear instructions on what users need to do with the product/app.
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Link to feedback form</Label>
            <Input
              id="feedback"
              value={data.feedback || ''}
              onChange={e => updateData({ feedback: e.target.value })}
              placeholder="Paste the feedback form URL here"
            />
            <div className="text-xs text-muted-foreground">
              Users will submit their feedback through this form after completing the task.
            </div>
          </div>
        </>
      )}
    </div>
  );
} 