import { useNewTaskStore } from "@/stores/new-task-store";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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

export default function Step5Review() {
  const { data, updateData } = useNewTaskStore();
  const { user } = useTaskMasterStore();
  const { taskMasters, fetchAllTaskMasters } = useAdminStore();
  const isSuperAdmin = user?.isSuperAdmin === true;

  // Fetch task masters if super admin
  useEffect(() => {
    if (isSuperAdmin && taskMasters.length === 0) {
      fetchAllTaskMasters();
    }
  }, [isSuperAdmin, taskMasters.length, fetchAllTaskMasters]);

  const getTaskTypeLabel = (type: string | undefined) => {
    switch (type) {
      case 'fillAForm':
        return 'Fill a Form';
      case 'checkOutApp':
        return 'Check Out App';
      case 'doVideoInterview':
        return 'Do Video Interview';
      default:
        return '-';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-2">Review Task Details</h2>
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-4">
          <div>
            <Label>Type:</Label>{" "}
            <span className="font-bold">{getTaskTypeLabel(data.type)}</span>
          </div>
          <div>
            <Label>Title:</Label>{" "}
            <span className="font-bold">{data.title || "-"}</span>
          </div>
          <div>
            <Label>Category:</Label>{" "}
            <span className="font-bold">{data.category || "-"}</span>
          </div>
          <div>
            <Label>Difficulty:</Label>{" "}
            <span className="font-bold">{data.difficulty || "-"}</span>
          </div>

          <div className="md:col-span-2">
            <Label>Link:</Label>{" "}
            <span className="break-all">{data.link || "-"}</span>
          </div>

          {data.type === 'checkOutApp' && (
            <>
              <div className="md:col-span-2">
                <Label>Instructions:</Label>{" "}
                <span className="whitespace-pre-wrap">{data.instructions || "-"}</span>
              </div>
              <div className="md:col-span-2">
                <Label>Feedback Form URL:</Label>{" "}
                <span className="break-all">{data.feedback || "-"}</span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Super Admin: Assign to Task Master */}
      {isSuperAdmin && (
        <Card className="p-4 border-primary/20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Assign to Task Master</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Assign this task to a different task master instead of yourself
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
                <Label htmlFor="assigned-task-master-select">Select Task Master</Label>
                {taskMasters.length > 0 ? (
                  <Select
                    value={data.assignedTaskMasterEmailAddress || ""}
                    onValueChange={(value) => updateData({ assignedTaskMasterEmailAddress: value })}
                  >
                    <SelectTrigger id="assigned-task-master-select">
                      <SelectValue placeholder="Select a task master..." />
                    </SelectTrigger>
                    <SelectContent>
                      {taskMasters
                        .filter((tm) => tm.emailAddress && tm.emailAddress !== user?.emailAddress)
                        .map((tm) => (
                          <SelectItem key={tm.id} value={tm.emailAddress || ""}>
                            {tm.name || tm.emailAddress} ({tm.emailAddress})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading task masters...</p>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
