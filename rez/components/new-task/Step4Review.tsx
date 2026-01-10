import { useNewTaskStore } from "@/stores/new-task-store";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { Switch } from "@/components/ui/switch";
import { useAdminStore } from "@/stores/admin-store";
import { useEffect } from "react";
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
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  DevicePhoneMobileIcon,
  VideoCameraIcon,
  TagIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const taskTypeConfig = {
  fillAForm: { label: "Fill a Form", icon: ClipboardDocumentListIcon },
  checkOutApp: { label: "Check Out App", icon: DevicePhoneMobileIcon },
  doVideoInterview: { label: "Video Interview", icon: VideoCameraIcon },
};

const difficultyColors = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-red-100 text-red-700",
};

export default function Step5Review() {
  const { data, updateData, setStep } = useNewTaskStore();
  const { user } = useTaskMasterStore();
  const { taskMasters, fetchAllTaskMasters } = useAdminStore();
  const isSuperAdmin = user?.isSuperAdmin === true;

  // Fetch task masters if super admin
  useEffect(() => {
    if (isSuperAdmin && taskMasters.length === 0) {
      fetchAllTaskMasters();
    }
  }, [isSuperAdmin, taskMasters.length, fetchAllTaskMasters]);

  const taskTypeInfo = data.type ? taskTypeConfig[data.type] : null;
  const TaskTypeIcon = taskTypeInfo?.icon || Squares2X2Icon;

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
          <div className="flex items-start justify-between">
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
                  <TaskTypeIcon className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">{taskTypeInfo?.label || "-"}</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
              className="text-[#5C29A3] hover:text-[#5C29A3] hover:bg-[#5C29A3]/10"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </Card>

        {/* Section 2: Task Details */}
        <Card className="p-3 border-2 border-gray-100">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-3">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(2)}
              className="text-[#5C29A3] hover:text-[#5C29A3] hover:bg-[#5C29A3]/10"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>

          <div className="ml-11 space-y-2">
            {/* Title */}
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                <DocumentTextIcon className="w-3 h-3" />
                <span>Title</span>
              </div>
              <p className="font-medium text-gray-900 text-sm">{data.title || "-"}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              {/* Category */}
              <div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                  <TagIcon className="w-3.5 h-3.5" />
                  <span>Category</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                  {data.category || "-"}
                </span>
              </div>

              {/* Difficulty */}
              <div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                  <ChartBarIcon className="w-3.5 h-3.5" />
                  <span>Difficulty</span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                  data.difficulty ? difficultyColors[data.difficulty] : 'bg-gray-100 text-gray-700'
                }`}>
                  {data.difficulty || "-"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Resources/Links */}
        <Card className="p-3 border-2 border-gray-100">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-3">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(3)}
              className="text-[#5C29A3] hover:text-[#5C29A3] hover:bg-[#5C29A3]/10"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>

          <div className="ml-11 space-y-2">
            {/* Main Link */}
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                <GlobeAltIcon className="w-3 h-3" />
                <span>{data.type === 'fillAForm' ? 'Form URL' : 'Product/App URL'}</span>
              </div>
              <a
                href={data.link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5C29A3] hover:underline break-all text-xs"
              >
                {data.link || "-"}
              </a>
            </div>

            {data.type === 'checkOutApp' && (
              <>
                {/* Instructions */}
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                    <DocumentTextIcon className="w-3 h-3" />
                    <span>Instructions</span>
                  </div>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 p-2 rounded-lg">
                    {data.instructions || "-"}
                  </p>
                </div>

                {/* Feedback Form */}
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                    <ChatBubbleLeftRightIcon className="w-3 h-3" />
                    <span>Feedback Form</span>
                  </div>
                  <a
                    href={data.feedback || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#5C29A3] hover:underline break-all text-xs"
                  >
                    {data.feedback || "-"}
                  </a>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Super Admin: Assign to Task Master */}
        {isSuperAdmin && (
          <Card className="p-5 border-2 border-[#5C29A3]/20 bg-[#5C29A3]/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#5C29A3]/20 flex items-center justify-center flex-shrink-0">
                <UserGroupIcon className="w-5 h-5 text-[#5C29A3]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label className="text-sm font-semibold text-gray-900">Assign to Task Master</Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Create this task on behalf of another task master
                    </p>
                  </div>
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
                  <div className="space-y-2">
                    <Label htmlFor="assigned-task-master-select" className="text-xs text-gray-500">
                      Select Task Master
                    </Label>
                    {taskMasters.length > 0 ? (
                      <Select
                        value={data.assignedTaskMasterEmailAddress || ""}
                        onValueChange={(value) => updateData({ assignedTaskMasterEmailAddress: value })}
                      >
                        <SelectTrigger id="assigned-task-master-select" className="bg-white">
                          <SelectValue placeholder="Choose a task master..." />
                        </SelectTrigger>
                        <SelectContent>
                          {taskMasters
                            .filter((tm) => tm.emailAddress && tm.emailAddress !== user?.emailAddress)
                            .map((tm) => (
                              <SelectItem key={tm.id} value={tm.emailAddress || ""}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{tm.name || "Unnamed"}</span>
                                  <span className="text-xs text-gray-500">{tm.emailAddress}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-gray-500 bg-white p-3 rounded-lg">
                        Loading task masters...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Ready to create indicator */}
        <div className="flex items-center justify-center gap-2 py-2 bg-green-50 rounded-lg border border-green-100">
          <CheckCircleIcon className="w-4 h-4 text-green-600" />
          <span className="text-xs font-medium text-green-700">
            Your task is ready to be created
          </span>
        </div>
      </div>
    </div>
  );
}
