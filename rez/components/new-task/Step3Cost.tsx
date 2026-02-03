import { useNewTaskStore } from '@/stores/new-task-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { CurrencyDollarIcon, UserGroupIcon, QuestionMarkCircleIcon, InformationCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { useMemo } from 'react';
import { useCountUp } from '@/hooks/use-count-up';
import { Badge } from '@/components/ui/badge';
import { isFieldRejected, getRejectionReasonsForField } from '@/utils/rejection-highlighting';
import { getRejectionReasonLabel } from '@/utils/rejection-reasons';

export default function Step3Cost() {
  const { data, updateData, editMode, editingTaskReasons, hasFieldChanged } = useNewTaskStore();

  const isOnlineSurvey = data.type === 'fillAForm';
  const isProductTesting = data.type === 'checkOutApp';

  const questionsLabel = isOnlineSurvey ? 'Questions' : 'Feedback questions';
  const questionsPlaceholder = isOnlineSurvey ? 'e.g. 10' : 'e.g. 5';
  const participantsLabel = isOnlineSurvey ? 'Participants' : 'Testers';
  const participantsPlaceholder = isOnlineSurvey ? 'e.g. 100' : 'e.g. 50';

  const participantsTooltip = isOnlineSurvey
    ? 'How many people do you want to complete your survey and give you answers?'
    : 'How many people do you want to test your product?';
  const questionsTooltip = isOnlineSurvey
    ? 'How many questions will your survey have?'
    : 'How many feedback questions will testers answer about your product?';

  const questions = isOnlineSurvey
    ? (data.numberOfQuestions || 0)
    : (data.numberOfFeedbackQuestions || 0);
  const participants = data.targetNumberOfParticipants || 0;

  const { cost, agencyCost, savingsPercent } = useMemo(() => {
    let baseCost = 0;

    if (isOnlineSurvey) {
      baseCost = 50 * (questions / 10) * (participants / 20);
    } else if (isProductTesting) {
      baseCost = 100 * (questions / 10) * (participants / 100);
    }

    const agencyCost = baseCost * 10;
    const savingsPercent = agencyCost > 0 ? Math.round(((agencyCost - baseCost) / agencyCost) * 100) : 0;

    return { cost: baseCost, agencyCost, savingsPercent };
  }, [questions, participants, isOnlineSurvey, isProductTesting]);

  const handleQuestionsChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    if (isOnlineSurvey) {
      updateData({ numberOfQuestions: numValue > 0 ? numValue : undefined });
    } else {
      updateData({ numberOfFeedbackQuestions: numValue > 0 ? numValue : undefined });
    }
  };

  const handleParticipantsChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    updateData({ targetNumberOfParticipants: numValue > 0 ? numValue : undefined });
  };

  const allFieldsComplete = questions > 0 && participants > 0;

  const animatedCost = useCountUp(cost, 500, allFieldsComplete);
  const animatedAgencyCost = useCountUp(agencyCost, 500, allFieldsComplete);

  const questionsFieldName = isOnlineSurvey ? 'numberOfQuestions' : 'numberOfFeedbackQuestions';
  const questionsWasRejected = editMode && isFieldRejected(questionsFieldName, editingTaskReasons, data.type || null);
  const questionsHasChanged = hasFieldChanged(questionsFieldName as keyof typeof data);
  const isQuestionsRejected = questionsWasRejected && !questionsHasChanged;
  const questionsRejectionReasons = editMode && editingTaskReasons 
    ? getRejectionReasonsForField(questionsFieldName, editingTaskReasons, data.type || null)
    : [];

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Cost</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Scope and estimated price for your {isOnlineSurvey ? 'survey' : 'product test'}
        </p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Label htmlFor="participants" className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <UserGroupIcon className="w-3.5 h-3.5" />
                {participantsLabel}
                {participants > 0 && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
              </Label>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label={participantsTooltip}>
                      <InformationCircleIcon className="w-3.5 h-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    {participantsTooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="participants"
              type="number"
              min={1}
              value={participants || ''}
              onChange={e => handleParticipantsChange(e.target.value)}
              placeholder={participantsPlaceholder}
              className="h-9 text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              {isOnlineSurvey ? 'People who will complete your survey' : 'People who will test your product'}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Label htmlFor="questions" className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
                {questionsLabel}
                {questions > 0 && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
              </Label>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label={questionsTooltip}>
                      <InformationCircleIcon className="w-3.5 h-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    {questionsTooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <Input
                id="questions"
                type="number"
                min={1}
                value={questions || ''}
                onChange={e => handleQuestionsChange(e.target.value)}
                placeholder={questionsPlaceholder}
                className={`h-9 text-sm ${isQuestionsRejected ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {isQuestionsRejected && (
                <div className="mt-1.5 flex items-start gap-1.5">
                  <ExclamationCircleIcon className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 mb-1">
                      Rejected
                    </Badge>
                    <p className="text-[11px] text-red-600">
                      {questionsRejectionReasons.map(getRejectionReasonLabel).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {isOnlineSurvey ? 'Number of questions in your survey' : 'Questions testers answer about your product'}
            </p>
          </div>
        </div>

        {allFieldsComplete && (
          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Your price</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-green-600 tabular-nums">${animatedCost}</span>
                <span className="text-xs text-gray-400 line-through tabular-nums">${animatedAgencyCost}</span>
                <span className="text-xs text-green-600 font-medium">({savingsPercent}% off)</span>
              </div>
            </div>
          </div>
        )}

        <p className="text-[11px] text-gray-400">
          Not charged at creation. Payment required before publishing.
        </p>
      </div>
    </div>
  );
}
