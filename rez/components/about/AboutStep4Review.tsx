import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function AboutStep4Review() {
  // Demo version - no functionality, just displays the UI with demo data
  const demoData = {
    type: 'fillAForm',
    title: 'Recycling Habits & Digital Rewards',
    category: 'Climate',
    difficulty: 'Easy',
    link: 'https://forms.example.com/recycling-survey',
  };

  const getTaskTypeLabel = (type: string | undefined) => {
    switch (type) {
      case 'fillAForm':
        return 'Fill a Form';
      case 'checkOutApp':
        return 'Check Out App';
      case 'doVideoInterview':
        return 'Do Video Interview';
      default:
        return '-';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-2">Review Task Details</h2>
      <Card className="p-4 bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-4">
          <div>
            <Label>Type:</Label>{" "}
            <span className="font-bold">{getTaskTypeLabel(demoData.type)}</span>
          </div>
          <div>
            <Label>Title:</Label>{" "}
            <span className="font-bold">{demoData.title}</span>
          </div>
          <div>
            <Label>Category:</Label>{" "}
            <span className="font-bold">{demoData.category}</span>
          </div>
          <div>
            <Label>Difficulty:</Label>{" "}
            <span className="font-bold">{demoData.difficulty}</span>
          </div>

          <div className="md:col-span-2">
            <Label>Link:</Label>{" "}
            <span className="break-all text-sm">{demoData.link}</span>
          </div>
        </div>
      </Card>

      <p className="text-sm text-muted-foreground mt-4 italic">
        💡 Review all your task details carefully. Once you click &quot;Finish&quot;, your task will be published to the Pax platform and participants can start completing it.
      </p>
    </div>
  );
}