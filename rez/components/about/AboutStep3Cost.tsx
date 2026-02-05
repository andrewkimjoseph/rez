import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { CurrencyDollarIcon, UserGroupIcon, QuestionMarkCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

export default function AboutStep3Cost() {
  // Demo data
  const demoData = {
    participants: 100,
    questions: 10,
    cost: 2500,
    agencyCost: 25000,
    savingsPercent: 90,
  };

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Cost</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Scope and estimated price for your survey
        </p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Label htmlFor="participants" className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <UserGroupIcon className="w-3.5 h-3.5" />
                Participants
                {demoData.participants > 0 && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
              </Label>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="How many people do you want to complete your survey and give you answers?">
                      <InformationCircleIcon className="w-3.5 h-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    How many people do you want to complete your survey and give you answers?
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="participants"
              type="number"
              min={1}
              value={demoData.participants}
              disabled
              className="h-9 text-sm bg-muted/50 border-green-200"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              People who will complete your survey
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Label htmlFor="questions" className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
                Questions
                {demoData.questions > 0 && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
              </Label>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="How many questions will your survey have?">
                      <InformationCircleIcon className="w-3.5 h-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    How many questions will your survey have?
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="questions"
              type="number"
              min={1}
              value={demoData.questions}
              disabled
              className="h-9 text-sm bg-muted/50 border-green-200"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Number of questions in your survey
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Your price</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-green-600 tabular-nums">${demoData.cost}</span>
              <span className="text-xs text-gray-400 line-through tabular-nums">${demoData.agencyCost}</span>
              <span className="text-xs text-green-600 font-medium">({demoData.savingsPercent}% off)</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-400">
          Not charged at creation. Payment required before publishing.
        </p>
      </div>
    </div>
  );
}
