import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AboutStep1TaskType() {
  // Demo version - no functionality, just displays the UI
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Select Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="p-4 border-2 border-[#5C29A3] bg-[#5C29A3]/5 cursor-default"
        >
          <div className="font-bold mb-1">Fill a Form</div>
          <div className="text-sm text-muted-foreground">
            Users fill out forms or surveys to provide feedback and data
          </div>
        </Card>

        <Card
          className="p-4 border-2 border-gray-200 hover:border-gray-300 cursor-default"
        >
          <div className="font-bold mb-1">Check Out App</div>
          <div className="text-sm text-muted-foreground">
            Users test and explore mobile or web applications
          </div>
        </Card>

        <Card
          className="p-4 border-2 border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed relative"
        >
          <Badge className="absolute top-2 right-2 bg-orange-500 hover:bg-orange-500">
            Coming Soon
          </Badge>
          <div className="font-bold mb-1 text-gray-500">Do Video Interview</div>
          <div className="text-sm text-muted-foreground">
            Users participate in video interviews for qualitative research
          </div>
        </Card>
      </div>
      <p className="text-sm text-muted-foreground mt-4 italic">
        💡 Click on a task type to select it. In this example, &quot;Fill a Form&quot; is selected.
      </p>
    </div>
  );
}