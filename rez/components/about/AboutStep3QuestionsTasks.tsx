import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AboutStep3QuestionsTasks() {
  // Demo version for "Fill a Form" type - no functionality, just displays the UI with demo data
  const taskType: 'fillAForm' | 'checkOutApp' = 'fillAForm'; // Could also be 'checkOutApp'

  const getLinkLabel = () => {
    if (taskType === 'fillAForm') return 'Link to form';
    if (taskType === 'checkOutApp') return 'Link to product';
    return 'Link';
  };

  const getLinkPlaceholder = () => {
    if (taskType === 'fillAForm') return 'Paste your form URL here';
    if (taskType === 'checkOutApp') return 'Paste your product/app URL here';
    return 'Paste the URL here';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="link">{getLinkLabel()}</Label>
        <Input
          id="link"
          value="https://forms.example.com/recycling-survey"
          placeholder={getLinkPlaceholder()}
          disabled
          className="bg-muted/50"
        />
      </div>

      {/* Show instructions and feedback for checkOutApp type */}
      {taskType === 'checkOutApp' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value="Explore the app and test the core features. Focus on the user experience and provide detailed feedback."
              placeholder="Enter instructions for users on how to complete this task..."
              rows={4}
              disabled
              className="bg-muted/50"
            />
            <div className="text-xs text-muted-foreground">
              Provide clear instructions on what users need to do with the product/app.
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Link to feedback form</Label>
            <Input
              id="feedback"
              value="https://forms.example.com/feedback"
              placeholder="Paste the feedback form URL here"
              disabled
              className="bg-muted/50"
            />
            <div className="text-xs text-muted-foreground">
              Users will submit their feedback through this form after completing the task.
            </div>
          </div>
        </>
      )}

      <p className="text-sm text-muted-foreground mt-4 italic">
        💡 {taskType === 'fillAForm' 
          ? 'Paste the URL to your survey or form. Participants will complete it through the Pax app.'
          : 'For app testing tasks, you also need to provide instructions and a feedback form URL.'}
      </p>
    </div>
  );
}