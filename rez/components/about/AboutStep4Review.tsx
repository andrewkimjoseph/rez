import { Card } from "@/components/ui/card";
import {
  Squares2X2Icon,
  DocumentTextIcon,
  LinkIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  TagIcon,
  ChartBarIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

export default function AboutStep4Review() {
  // Demo data
  const demoData = {
    type: 'fillAForm',
    title: 'Recycling Habits & Digital Rewards',
    category: 'Climate',
    difficulty: 'Easy',
    link: 'https://forms.example.com/recycling-survey',
  };

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Review your task</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Make sure everything looks correct before creating your task
        </p>
      </div>

      <div className="space-y-3">
        {/* Section 1: Task Type */}
        <Card className="p-3 border-2 border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#5C29A3]/10 flex items-center justify-center flex-shrink-0">
              <Squares2X2Icon className="w-4 h-4 text-[#5C29A3]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Task Type</span>
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex items-center gap-2">
                <ClipboardDocumentListIcon className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-900">Fill a Form</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Task Details */}
        <Card className="p-3 border-2 border-gray-100">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <DocumentTextIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Task Details</span>
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </div>

          <div className="ml-11 space-y-2">
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                <DocumentTextIcon className="w-3 h-3" />
                <span>Title</span>
              </div>
              <p className="font-medium text-gray-900 text-sm">{demoData.title}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                  <TagIcon className="w-3.5 h-3.5" />
                  <span>Category</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                  {demoData.category}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                  <ChartBarIcon className="w-3.5 h-3.5" />
                  <span>Difficulty</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  {demoData.difficulty}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Resources/Links */}
        <Card className="p-3 border-2 border-gray-100">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
              <LinkIcon className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Resources</span>
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </div>

          <div className="ml-11 space-y-2">
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                <GlobeAltIcon className="w-3 h-3" />
                <span>Form URL</span>
              </div>
              <span className="text-[#5C29A3] break-all text-xs">
                {demoData.link}
              </span>
            </div>
          </div>
        </Card>

        {/* Ready to create indicator */}
        <div className="flex items-center justify-center gap-2 py-2 bg-green-50 rounded-lg border border-green-100">
          <CheckCircleIcon className="w-4 h-4 text-green-600" />
          <span className="text-xs font-medium text-green-700">
            Your task is ready to be created
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-4 italic">
        Review all your task details carefully. Once you click &quot;Finish&quot;, your task will be published to the Pax platform.
      </p>
    </div>
  );
}
