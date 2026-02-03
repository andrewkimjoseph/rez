import { useNewTaskStore, TaskStep } from "@/stores/new-task-store";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { Switch } from "@/components/ui/switch";
import { useAdminStore } from "@/stores/admin-store";
import { useEffect, useMemo } from "react";
import { useCountUp } from "@/hooks/use-count-up";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Squares2X2Icon,
  DocumentTextIcon,
  LinkIcon,
  PencilIcon,
  ClipboardDocumentListIcon,
  DevicePhoneMobileIcon,
  VideoCameraIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  QuestionMarkCircleIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

const taskTypeConfig = {
  fillAForm: { label: "Online Survey", icon: ClipboardDocumentListIcon },
  checkOutApp: { label: "Product Testing", icon: DevicePhoneMobileIcon },
  doVideoInterview: { label: "Video Interview", icon: VideoCameraIcon },
};

const difficultyColors = {
  Easy: "text-green-600",
  Medium: "text-amber-600",
  Hard: "text-red-600",
};

export default function Step5Review() {
  const { data, updateData, setStep } = useNewTaskStore();
  const { user } = useTaskMasterStore();
  const { taskMasters, fetchAllTaskMasters } = useAdminStore();
  const isSuperAdmin = user?.isSuperAdmin === true;

  useEffect(() => {
    if (isSuperAdmin && taskMasters.length === 0) {
      fetchAllTaskMasters();
    }
  }, [isSuperAdmin, taskMasters.length, fetchAllTaskMasters]);

  const taskTypeInfo = data.type ? taskTypeConfig[data.type] : null;
  const TaskTypeIcon = taskTypeInfo?.icon || Squares2X2Icon;

  const isOnlineSurvey = data.type === 'fillAForm';
  const isProductTesting = data.type === 'checkOutApp';
  
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

  const handleEdit = (step: TaskStep) => setStep(step);

  const showCost = cost > 0;
  const animatedCost = useCountUp(cost, 500, showCost);
  const animatedAgencyCost = useCountUp(agencyCost, 500, showCost);

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
                  <span className="text-sm font-medium text-gray-900">{taskTypeInfo?.label || "-"}</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleEdit(1)} className="h-7 px-2 text-xs text-gray-500 hover:text-[#5C29A3]">
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
                  <p className="text-sm font-medium text-gray-900">{data.title || "-"}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500">{data.category || "-"}</span>
                  <span className="text-gray-300">•</span>
                  <span className={data.difficulty ? difficultyColors[data.difficulty] : 'text-gray-500'}>
                    {data.difficulty || "-"}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleEdit(2)} className="h-7 px-2 text-xs text-gray-500 hover:text-[#5C29A3]">
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
                    <span className="text-gray-500">{questions} {isOnlineSurvey ? 'questions' : 'feedback questions'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserGroupIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-500">{participants} {isOnlineSurvey ? 'participants' : 'testers'}</span>
                  </div>
                </div>
                {showCost && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-green-600 tabular-nums">${animatedCost}</span>
                    <span className="text-xs text-gray-400 line-through tabular-nums">${animatedAgencyCost}</span>
                    <span className="text-xs text-green-600 font-medium">({savingsPercent}% off)</span>
                  </div>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleEdit(3)} className="h-7 px-2 text-xs text-gray-500 hover:text-[#5C29A3]">
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
                  <p className="text-xs text-gray-400 mb-0.5">{isOnlineSurvey ? 'Form URL' : 'Product URL'}</p>
                  <a
                    href={data.link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#5C29A3] hover:underline break-all"
                  >
                    {data.link || "-"}
                  </a>
                </div>
                {isProductTesting && data.instructions && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Instructions</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{data.instructions}</p>
                  </div>
                )}
                {isProductTesting && data.feedback && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Feedback Form</p>
                    <a
                      href={data.feedback || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#5C29A3] hover:underline break-all"
                    >
                      {data.feedback}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleEdit(4)} className="h-7 px-2 text-xs text-gray-500 hover:text-[#5C29A3] flex-shrink-0">
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

        {/* Super Admin: Assign to Task Master */}
        {isSuperAdmin && (
          <div className="px-4 py-3 bg-[#5C29A3]/5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#5C29A3]/10 flex items-center justify-center">
                <UserGroupIcon className="w-4 h-4 text-[#5C29A3]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">Assign to another Task Master</p>
                  <Switch
                    checked={data.assignToTaskMaster || false}
                    onCheckedChange={(checked) => {
                      updateData({ assignToTaskMaster: checked });
                      if (!checked) {
                        updateData({ assignedTaskMasterEmailAddress: undefined });
                      }
                    }}
                  />
                </div>
                {data.assignToTaskMaster && (
                  <div className="mt-2">
                    <Label htmlFor="assigned-task-master-select" className="text-xs text-gray-500 mb-1 block">
                      Select Task Master
                    </Label>
                    {taskMasters.length > 0 ? (
                      <Select
                        value={data.assignedTaskMasterEmailAddress || ""}
                        onValueChange={(value) => updateData({ assignedTaskMasterEmailAddress: value })}
                      >
                        <SelectTrigger id="assigned-task-master-select" className="bg-white h-9 text-sm">
                          <SelectValue placeholder="Choose..." />
                        </SelectTrigger>
                        <SelectContent>
                          {taskMasters
                            .filter((tm) => tm.emailAddress && tm.emailAddress !== user?.emailAddress)
                            .map((tm) => (
                              <SelectItem key={tm.id} value={tm.emailAddress || ""}>
                                <span className="font-medium">{tm.name || "Unnamed"}</span>
                                <span className="text-gray-400 ml-1">({tm.emailAddress})</span>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-gray-500">Loading...</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ready indicator */}
      <div className="mt-4 text-center">
        <p className="text-sm text-green-600 font-medium">Ready to create your task</p>
      </div>
    </div>
  );
}
