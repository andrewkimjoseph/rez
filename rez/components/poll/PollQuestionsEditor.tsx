'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { MAX_POLL_QUESTIONS, type PollQuestionDraft } from '@/types/poll';

type PollQuestionsEditorProps = {
  value: PollQuestionDraft[];
  onChange: (questions: PollQuestionDraft[]) => void;
  readOnly?: boolean;
  textOnlyMode?: boolean;
  showHeader?: boolean;
  className?: string;
};

const defaultQuestions = (): PollQuestionDraft[] => [
  { questionText: '', options: ['', ''] },
];

export function PollQuestionsEditor({
  value,
  onChange,
  readOnly = false,
  textOnlyMode = false,
  showHeader = true,
  className = '',
}: PollQuestionsEditorProps) {
  const pollQuestions = value.length ? value : defaultQuestions();
  const canStructureEdit = !readOnly && !textOnlyMode;

  const updatePollQuestionText = (qIndex: number, text: string) => {
    const next = pollQuestions.map((q, i) =>
      i === qIndex ? { ...q, questionText: text } : q,
    );
    onChange(next);
  };

  const updatePollOption = (qIndex: number, oIndex: number, text: string) => {
    const next = pollQuestions.map((q, i) => {
      if (i !== qIndex) return q;
      const options = [...q.options];
      options[oIndex] = text;
      return { ...q, options };
    });
    onChange(next);
  };

  const addPollOption = (qIndex: number) => {
    const next = pollQuestions.map((q, i) =>
      i === qIndex ? { ...q, options: [...q.options, ''] } : q,
    );
    onChange(next);
  };

  const removePollOption = (qIndex: number, oIndex: number) => {
    const next = pollQuestions.map((q, i) => {
      if (i !== qIndex || q.options.length <= 2) return q;
      return { ...q, options: q.options.filter((_, j) => j !== oIndex) };
    });
    onChange(next);
  };

  const addPollQuestion = () => {
    if (pollQuestions.length >= MAX_POLL_QUESTIONS) return;
    onChange([...pollQuestions, { questionText: '', options: ['', ''] }]);
  };

  const removePollQuestion = (qIndex: number) => {
    if (pollQuestions.length <= 1) return;
    onChange(pollQuestions.filter((_, i) => i !== qIndex));
  };

  return (
    <div className={className}>
      {showHeader && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Poll questions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {textOnlyMode
                ? 'Text-only edits — question and option counts are fixed while responses exist'
                : `Up to ${MAX_POLL_QUESTIONS} multiple-choice questions`}
            </p>
          </div>
          {canStructureEdit && (
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
          )}
        </div>
      )}

      <div className="space-y-4">
        {pollQuestions.map((question, qIndex) => (
          <div
            key={qIndex}
            className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Question {qIndex + 1}
              </Label>
              {canStructureEdit && pollQuestions.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-red-500"
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
              readOnly={readOnly}
              disabled={readOnly}
            />
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-2 block">
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
                      readOnly={readOnly}
                      disabled={readOnly}
                    />
                    {canStructureEdit && question.options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-red-500"
                        onClick={() => removePollOption(qIndex, oIndex)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {canStructureEdit && (
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
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
