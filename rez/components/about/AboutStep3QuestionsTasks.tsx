import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  CheckCircleIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

export default function AboutStep3QuestionsTasks() {
  // Demo data for "Fill a Form" type
  const demoData = {
    link: 'https://forms.example.com/recycling-survey',
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Add your resources</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Provide the link where users will complete this task
        </p>
      </div>

      <div className="space-y-4">
        {/* Main Link Field */}
        <Card className="p-4 border-2 border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#5C29A3]/10 flex items-center justify-center flex-shrink-0">
              <GlobeAltIcon className="w-4 h-4 text-[#5C29A3]" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="link" className="text-sm font-semibold">Form URL</Label>
                <CheckCircleSolidIcon className="w-4 h-4 text-green-500" />
              </div>
              <Input
                id="link"
                value={demoData.link}
                disabled
                className="bg-muted/50 border-green-200"
              />
              <p className="text-xs text-gray-400">
                The URL where users will access and fill out your form or survey
              </p>
            </div>
          </div>
        </Card>

        {/* Completion status */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-600 font-medium">All resources added</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-4 italic">
        Paste the URL to your survey or form. Participants will complete it through the Pax app.
      </p>
    </div>
  );
}
