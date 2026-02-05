import {
  Squares2X2Icon,
  DocumentTextIcon,
  LinkIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
  PencilIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

const difficultyColors = {
  Easy: "text-green-600",
  Medium: "text-amber-600",
  Hard: "text-red-600",
};

export default function AboutStep4Review() {
  // Demo data
  const demoData = {
    type: 'fillAForm',
    title: 'Recycling Habits & Digital Rewards',
    category: 'Climate',
    difficulty: 'Easy',
    participants: 100,
    questions: 10,
    cost: 2500,
    agencyCost: 25000,
    savingsPercent: 90,
    link: 'https://forms.example.com/recycling-survey',
  };

  const TaskTypeIcon = ClipboardDocumentListIcon;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Review your task</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Confirm everything looks correct before creating
        </p>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
        {/* Task Type */}
        <div className="px-4 py-3 bg-white hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#5C29A3]/10 flex items-center justify-center">
                <Squares2X2Icon className="w-4 h-4 text-[#5C29A3]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Type</p>
                <div className="flex items-center gap-1.5">
                  <TaskTypeIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">Online Survey</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-500 hover:text-[#5C29A3]">
              <PencilIcon className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </div>
        </div>

        {/* Task Details */}
        <div className="px-4 py-3 bg-white hover:bg-gray-50/50 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <DocumentTextIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div className="space-y-1.5">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Title</p>
                  <p className="text-sm font-medium text-gray-900">{demoData.title}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500">{demoData.category}</span>
                  <span className="text-gray-300">•</span>
                  <span className={difficultyColors[demoData.difficulty as keyof typeof difficultyColors]}>
                    {demoData.difficulty}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-500 hover:text-[#5C29A3]">
              <PencilIcon className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </div>
        </div>

        {/* Cost */}
        <div className="px-4 py-3 bg-white hover:bg-gray-50/50 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <QuestionMarkCircleIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-500">{demoData.questions} questions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserGroupIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-500">{demoData.participants} participants</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-green-600 tabular-nums">${demoData.cost}</span>
                  <span className="text-xs text-gray-400 line-through tabular-nums">${demoData.agencyCost}</span>
                  <span className="text-xs text-green-600 font-medium">({demoData.savingsPercent}% off)</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-500 hover:text-[#5C29A3]">
              <PencilIcon className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </div>
        </div>

        {/* Resources */}
        <div className="px-4 py-3 bg-white hover:bg-gray-50/50 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <LinkIcon className="w-4 h-4 text-amber-600" />
              </div>
              <div className="space-y-1.5 min-w-0 flex-1">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Form URL</p>
                  <a
                    href={demoData.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#5C29A3] hover:underline break-all"
                  >
                    {demoData.link}
                  </a>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-500 hover:text-[#5C29A3] flex-shrink-0">
              <PencilIcon className="w-3 h-3 mr-1" />
              Edit
            </Button>
          </div>
        </div>

        {/* Targeting (informational) */}
        <div className="px-4 py-3 bg-slate-50/80">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200/80 flex items-center justify-center flex-shrink-0">
              <MapPinIcon className="w-4 h-4 text-slate-600" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 mb-0.5">Who you&apos;re reaching</p>
              <p className="text-sm text-slate-700">
                Right now, our participants tend to be based in <strong>Kenya</strong>, and the pool skews <strong>male</strong> (roughly 5 to 1). We don&apos;t offer custom targeting yet—just so you know what to expect.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
