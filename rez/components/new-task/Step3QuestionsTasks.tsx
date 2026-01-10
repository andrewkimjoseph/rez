import { useNewTaskStore } from '@/stores/new-task-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  LinkIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { useMemo } from 'react';

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
  const { data, updateData } = useNewTaskStore();

  const getLinkLabel = () => {
    if (data.type === 'fillAForm') return 'Form URL';
    if (data.type === 'checkOutApp') return 'Product/App URL';
    return 'Link';
  };

  const getLinkPlaceholder = () => {
    if (data.type === 'fillAForm') return 'https://forms.google.com/...';
    if (data.type === 'checkOutApp') return 'https://play.google.com/... or https://apps.apple.com/...';
    return 'https://...';
  };

  const getLinkDescription = () => {
    if (data.type === 'fillAForm') return 'The URL where users will access and fill out your form or survey';
    if (data.type === 'checkOutApp') return 'Link to the app store listing or web app that users will test';
    return 'The main URL for this task';
  };

  const linkValidation = useMemo(() => {
    if (!data.link) return { valid: false, message: '' };
    if (isValidUrl(data.link)) return { valid: true, message: 'Valid URL' };
    return { valid: false, message: 'Please enter a valid URL (starting with https://)' };
  }, [data.link]);

  const feedbackValidation = useMemo(() => {
    if (!data.feedback) return { valid: false, message: '' };
    if (isValidUrl(data.feedback)) return { valid: true, message: 'Valid URL' };
    return { valid: false, message: 'Please enter a valid URL' };
  }, [data.feedback]);

  const isCheckOutApp = data.type === 'checkOutApp';

  const getCompletionStatus = () => {
    if (isCheckOutApp) {
      const completed = [data.link, data.instructions, data.feedback].filter(Boolean).length;
      return { completed, total: 3 };
    }
    return { completed: data.link ? 1 : 0, total: 1 };
  };

  const completionStatus = getCompletionStatus();

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Add your resources</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {isCheckOutApp
            ? 'Provide the links and instructions users need to complete this task'
            : 'Provide the link where users will complete this task'
          }
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="link" className="text-sm font-semibold">{getLinkLabel()}</Label>
                  {linkValidation.valid && (
                    <CheckCircleSolidIcon className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
              <Input
                id="link"
                value={data.link || ''}
                onChange={e => updateData({ link: e.target.value })}
                placeholder={getLinkPlaceholder()}
                className={`transition-all duration-200 ${
                  data.link
                    ? linkValidation.valid
                      ? 'border-green-200 focus:border-green-400'
                      : 'border-red-200 focus:border-red-400'
                    : ''
                }`}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{getLinkDescription()}</p>
                {data.link && !linkValidation.valid && (
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <ExclamationCircleIcon className="w-3.5 h-3.5" />
                    <span>{linkValidation.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Additional fields for Check Out App */}
        {isCheckOutApp && (
          <>
            {/* Instructions Field */}
            <Card className="p-4 border-2 border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="instructions" className="text-sm font-semibold">Instructions</Label>
                    {data.instructions && (
                      <CheckCircleSolidIcon className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <Textarea
                    id="instructions"
                    value={data.instructions || ''}
                    onChange={e => updateData({ instructions: e.target.value })}
                    placeholder="Enter step-by-step instructions for users on how to complete this task..."
                    rows={4}
                    className={`transition-all duration-200 resize-none ${
                      data.instructions
                        ? 'border-green-200 focus:border-green-400'
                        : ''
                    }`}
                  />
                  <p className="text-xs text-gray-400">
                    Be specific about what users should do, look for, or test in the app
                  </p>
                </div>
              </div>
            </Card>

            {/* Feedback Form Field */}
            <Card className="p-4 border-2 border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="feedback" className="text-sm font-semibold">Feedback Form URL</Label>
                    {feedbackValidation.valid && (
                      <CheckCircleSolidIcon className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <Input
                    id="feedback"
                    value={data.feedback || ''}
                    onChange={e => updateData({ feedback: e.target.value })}
                    placeholder="https://forms.google.com/..."
                    className={`transition-all duration-200 ${
                      data.feedback
                        ? feedbackValidation.valid
                          ? 'border-green-200 focus:border-green-400'
                          : 'border-red-200 focus:border-red-400'
                        : ''
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      Users will submit their feedback and findings through this form
                    </p>
                    {data.feedback && !feedbackValidation.valid && (
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <ExclamationCircleIcon className="w-3.5 h-3.5" />
                        <span>{feedbackValidation.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Completion status */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {completionStatus.completed === completionStatus.total ? (
              <>
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-600 font-medium">All resources added</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  {Array.from({ length: completionStatus.total }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full ${idx < completionStatus.completed ? 'bg-green-500' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {completionStatus.completed} of {completionStatus.total} {isCheckOutApp ? 'resources' : 'resource'} added
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
