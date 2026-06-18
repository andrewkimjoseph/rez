import { useNewTaskStore } from '@/stores/new-task-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { GlobeAltIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, ExclamationCircleIcon, InformationCircleIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isFieldRejected, getRejectionReasonsForField } from '@/utils/rejection-highlighting';
import { getRejectionReasonLabel } from '@/utils/rejection-reasons';
import { TOOLTIP_TEXTS } from '@/data/tooltip-texts';
import { MAX_POLL_QUESTIONS, validatePollQuestions, type PollQuestionDraft } from '@/types/poll';

const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export default function Step4QuestionsTasks() {
  const { data, updateData, editMode, editingTaskReasons, hasFieldChanged } = useNewTaskStore();

  const getLinkLabel = () => {
    if (data.type === 'fillAForm') return 'Form URL';
    if (data.type === 'checkOutApp') return 'Product/App URL';
    return 'Link';
  };

  const getLinkPlaceholder = () => {
    if (data.type === 'fillAForm') return 'https://tally.so/r/... or https://tally.so/forms/...';
    if (data.type === 'checkOutApp') return 'https://play.google.com/... or App Store link';
    return 'https://...';
  };

  const linkValidation = useMemo(() => {
    if (!data.link) return { valid: false, message: '' };
    if (isValidUrl(data.link)) return { valid: true, message: '' };
    return { valid: false, message: 'Enter a valid URL (https://)' };
  }, [data.link]);

  const feedbackValidation = useMemo(() => {
    if (!data.feedback) return { valid: false, message: '' };
    if (isValidUrl(data.feedback)) return { valid: true, message: '' };
    return { valid: false, message: 'Enter a valid URL' };
  }, [data.feedback]);

  const isCheckOutApp = data.type === 'checkOutApp';
  const isPoll = data.type === 'answerPoll';

  const defaultPollQuestions = (): PollQuestionDraft[] => [
    { questionText: '', options: ['', ''] },
  ];

  const pollQuestions =
    data.pollQuestions?.length ? data.pollQuestions : defaultPollQuestions();

  const updatePollQuestionText = (qIndex: number, value: string) => {
    const next = pollQuestions.map((q, i) =>
      i === qIndex ? { ...q, questionText: value } : q,
    );
    updateData({ pollQuestions: next });
  };

  const updatePollOption = (qIndex: number, oIndex: number, value: string) => {
    const next = pollQuestions.map((q, i) => {
      if (i !== qIndex) return q;
      const options = [...q.options];
      options[oIndex] = value;
      return { ...q, options };
    });
    updateData({ pollQuestions: next });
  };

  const addPollOption = (qIndex: number) => {
    const next = pollQuestions.map((q, i) =>
      i === qIndex ? { ...q, options: [...q.options, ''] } : q,
    );
    updateData({ pollQuestions: next });
  };

  const removePollOption = (qIndex: number, oIndex: number) => {
    const next = pollQuestions.map((q, i) => {
      if (i !== qIndex || q.options.length <= 2) return q;
      return { ...q, options: q.options.filter((_, j) => j !== oIndex) };
    });
    updateData({ pollQuestions: next });
  };

  const addPollQuestion = () => {
    if (pollQuestions.length >= MAX_POLL_QUESTIONS) return;
    updateData({
      pollQuestions: [...pollQuestions, { questionText: '', options: ['', ''] }],
    });
  };

  const removePollQuestion = (qIndex: number) => {
    if (pollQuestions.length <= 1) return;
    updateData({ pollQuestions: pollQuestions.filter((_, i) => i !== qIndex) });
  };

  if (isPoll) {
    return (
      <div>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Poll questions</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Add up to {MAX_POLL_QUESTIONS} multiple-choice questions
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs shrink-0"
            onClick={addPollQuestion}
            disabled={pollQuestions.length >= MAX_POLL_QUESTIONS}
          >
            <PlusIcon className="w-3.5 h-3.5 mr-1" />
            Add question
          </Button>
        </div>

        <div className="space-y-4">
          {pollQuestions.map((question, qIndex) => (
            <div
              key={qIndex}
              className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium text-gray-500">
                  Question {qIndex + 1}
                </Label>
                {pollQuestions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-gray-400 hover:text-red-500"
                    onClick={() => removePollQuestion(qIndex)}
                  >
                    <TrashIcon className="w-3.5 h-3.5 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
              <Textarea
                value={question.questionText}
                onChange={(e) => updatePollQuestionText(qIndex, e.target.value)}
                placeholder="e.g. Would you trust a stablecoin issued by your country's central bank?"
                className="min-h-[72px] text-sm"
              />
              <div>
                <Label className="text-xs font-medium text-gray-500 mb-2 block">
                  Answer options
                </Label>
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updatePollOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        className="h-9 text-sm"
                      />
                      {question.options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-gray-400 hover:text-red-500"
                          onClick={() => removePollOption(qIndex, oIndex)}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 h-8 text-xs"
                  onClick={() => addPollOption(qIndex)}
                >
                  <PlusIcon className="w-3.5 h-3.5 mr-1" />
                  Add option
                </Button>
              </div>
            </div>
          ))}

          <div>
            <Label htmlFor="instructions" className="text-xs font-medium text-gray-500 mb-1 block">
              Instructions (optional)
            </Label>
            <Textarea
              id="instructions"
              value={data.instructions || ''}
              onChange={(e) => updateData({ instructions: e.target.value })}
              placeholder="Any extra guidance for participants"
              className="min-h-[60px] text-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  const linkWasRejected = editMode && isFieldRejected('link', editingTaskReasons, data.type || null);
  const linkHasChanged = hasFieldChanged('link');
  const isLinkRejected = linkWasRejected && !linkHasChanged;
  const linkRejectionReasons = editMode && editingTaskReasons 
    ? getRejectionReasonsForField('link', editingTaskReasons, data.type || null)
    : [];

  const instructionsWasRejected = editMode && isFieldRejected('instructions', editingTaskReasons, data.type || null);
  const instructionsHasChanged = hasFieldChanged('instructions');
  const isInstructionsRejected = instructionsWasRejected && !instructionsHasChanged;
  const instructionsRejectionReasons = editMode && editingTaskReasons 
    ? getRejectionReasonsForField('instructions', editingTaskReasons, data.type || null)
    : [];

  const feedbackWasRejected = editMode && isFieldRejected('feedback', editingTaskReasons, data.type || null);
  const feedbackHasChanged = hasFieldChanged('feedback');
  const isFeedbackRejected = feedbackWasRejected && !feedbackHasChanged;
  const feedbackRejectionReasons = editMode && editingTaskReasons 
    ? getRejectionReasonsForField('feedback', editingTaskReasons, data.type || null)
    : [];

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Resources</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {isCheckOutApp ? 'Links and instructions for users' : 'Where users complete the task'}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Label htmlFor="link" className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
              <GlobeAltIcon className="w-3.5 h-3.5" />
              {getLinkLabel()}
              {linkValidation.valid && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
            </Label>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label={isCheckOutApp ? 'Where is your product located?' : 'Where is your form located?'}>
                    <InformationCircleIcon className="w-3.5 h-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px]">
                  {isCheckOutApp ? TOOLTIP_TEXTS.linkCheckOutApp : TOOLTIP_TEXTS.linkFillAForm}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <Input
              id="link"
              value={data.link || ''}
              onChange={e => updateData({ link: e.target.value })}
              placeholder={getLinkPlaceholder()}
              className={`h-9 text-sm ${
                isLinkRejected 
                  ? 'border-red-500 focus-visible:ring-red-500' 
                  : data.link && !linkValidation.valid 
                    ? 'border-red-200 focus-visible:ring-red-200' 
                    : ''
              }`}
            />
            {isLinkRejected && (
              <div className="mt-1.5 flex items-start gap-1.5">
                <ExclamationCircleIcon className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 mb-1">
                    Rejected
                  </Badge>
                  <p className="text-[11px] text-red-600">
                    {linkRejectionReasons.map(getRejectionReasonLabel).join(', ')}
                  </p>
                </div>
              </div>
            )}
            {!isLinkRejected && data.link && !linkValidation.valid && (
              <p className="flex items-center gap-1 mt-1 text-[11px] text-red-500">
                <ExclamationCircleIcon className="w-3 h-3 flex-shrink-0" />
                {linkValidation.message}
              </p>
            )}
            {data.type === 'fillAForm' && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Use a <span className="font-medium">Tally form</span> (tally.so) with{' '}
                <a
                  href="https://tally.so/help/redirect-on-completion"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Redirect on completion
                </a>
                {' '}set to <code className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">thepaxtask://</code>
              </p>
            )}
          </div>
        </div>

        {isCheckOutApp && (
          <>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Label htmlFor="instructions" className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <DocumentTextIcon className="w-3.5 h-3.5" />
                  Instructions
                  {data.instructions && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                </Label>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="What should users do?">
                        <InformationCircleIcon className="w-3.5 h-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px]">
                      {TOOLTIP_TEXTS.instructionsCheckOutApp}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="relative">
                <Textarea
                  id="instructions"
                  value={data.instructions || ''}
                  onChange={e => updateData({ instructions: e.target.value })}
                  placeholder="Step-by-step instructions for users..."
                  rows={3}
                  className={`text-sm resize-none min-h-[72px] ${isInstructionsRejected ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {isInstructionsRejected && (
                  <div className="mt-1.5 flex items-start gap-1.5">
                    <ExclamationCircleIcon className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 mb-1">
                        Rejected
                      </Badge>
                      <p className="text-[11px] text-red-600">
                        {instructionsRejectionReasons.map(getRejectionReasonLabel).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Label htmlFor="feedback" className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                  Feedback form URL
                  {feedbackValidation.valid && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                </Label>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Where do users submit feedback?">
                        <InformationCircleIcon className="w-3.5 h-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px]">
                      {TOOLTIP_TEXTS.feedbackCheckOutApp}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="relative">
                <Input
                  id="feedback"
                  value={data.feedback || ''}
                  onChange={e => updateData({ feedback: e.target.value })}
                  placeholder="https://forms.google.com/..."
                  className={`h-9 text-sm ${
                    isFeedbackRejected 
                      ? 'border-red-500 focus-visible:ring-red-500' 
                      : data.feedback && !feedbackValidation.valid 
                        ? 'border-red-200 focus-visible:ring-red-200' 
                        : ''
                  }`}
                />
                {isFeedbackRejected && (
                  <div className="mt-1.5 flex items-start gap-1.5">
                    <ExclamationCircleIcon className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 mb-1">
                        Rejected
                      </Badge>
                      <p className="text-[11px] text-red-600">
                        {feedbackRejectionReasons.map(getRejectionReasonLabel).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
                {!isFeedbackRejected && data.feedback && !feedbackValidation.valid && (
                  <p className="flex items-center gap-1 mt-1 text-[11px] text-red-500">
                    <ExclamationCircleIcon className="w-3 h-3 flex-shrink-0" />
                    {feedbackValidation.message}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
