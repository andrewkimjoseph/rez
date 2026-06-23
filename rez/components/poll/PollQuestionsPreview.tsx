'use client';

import { PollQuestionsEditor } from '@/components/poll/PollQuestionsEditor';
import type { PollQuestionDraft } from '@/types/poll';

type PollQuestionsPreviewProps = {
  pollQuestions: PollQuestionDraft[];
  responseCount?: number;
  className?: string;
};

export function PollQuestionsPreview({
  pollQuestions,
  responseCount = 0,
  className = '',
}: PollQuestionsPreviewProps) {
  if (!pollQuestions.length) {
    return (
      <p className={`text-sm text-muted-foreground ${className}`}>
        No poll questions found.
      </p>
    );
  }

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Submitted poll questions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pollQuestions.length} question{pollQuestions.length === 1 ? '' : 's'}
            {responseCount > 0
              ? ` · ${responseCount} response${responseCount === 1 ? '' : 's'} (text-only edits in admin)`
              : ''}
          </p>
        </div>
      </div>
      <PollQuestionsEditor
        value={pollQuestions}
        onChange={() => {}}
        readOnly
        showHeader={false}
      />
    </div>
  );
}
