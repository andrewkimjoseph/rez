import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { TOOLTIP_TEXTS } from '@/data/tooltip-texts';

export default function AboutStep3QuestionsTasks() {
  // Demo data for "Fill a Form" type
  const demoData = {
    link: 'https://forms.example.com/recycling-survey',
  };

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Resources</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Where users complete the task
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Label htmlFor="link" className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
              <GlobeAltIcon className="w-3.5 h-3.5" />
              Form URL
              <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />
            </Label>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Where is your form located?">
                    <InformationCircleIcon className="w-3.5 h-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px]">
                  {TOOLTIP_TEXTS.linkForm}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="link"
            value={demoData.link}
            disabled
            className="h-9 text-sm bg-muted/50 border-green-200"
          />
        </div>
      </div>
    </div>
  );
}
