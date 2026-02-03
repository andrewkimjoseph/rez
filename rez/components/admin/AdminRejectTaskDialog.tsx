"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Task } from "@/firebase/firestore/models/Task";
import {
  getRejectionReasonsForTaskType,
  REJECTION_REASONS,
} from "@/utils/rejection-reasons";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

interface AdminRejectTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reasons: number[]) => void;
  isUpdating?: boolean;
}

export default function AdminRejectTaskDialog({
  task,
  open,
  onOpenChange,
  onConfirm,
  isUpdating = false,
}: AdminRejectTaskDialogProps) {
  const [selectedReasons, setSelectedReasons] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get applicable reasons based on task type
  const applicableReasons = task
    ? getRejectionReasonsForTaskType(task.type)
    : REJECTION_REASONS;

  // Reset selected reasons when dialog opens/closes or task changes
  useEffect(() => {
    if (open && task) {
      // Pre-select existing reasons if editing
      setSelectedReasons(task.reasonsForRejection || []);
      setError(null);
    } else if (!open) {
      setSelectedReasons([]);
      setError(null);
    }
  }, [open, task]);

  const handleReasonToggle = (reasonId: number) => {
    setSelectedReasons((prev) => {
      if (prev.includes(reasonId)) {
        return prev.filter((id) => id !== reasonId);
      } else {
        return [...prev, reasonId];
      }
    });
    setError(null);
  };

  const handleConfirm = () => {
    if (selectedReasons.length === 0) {
      setError("Please select at least one rejection reason");
      return;
    }
    onConfirm(selectedReasons);
  };

  const handleCancel = () => {
    setSelectedReasons([]);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reject Task</DialogTitle>
          <DialogDescription>
            Select one or more reasons for rejecting &quot;{task?.title || "this task"}&quot;.
            The task master will see these reasons and can update the task accordingly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {applicableReasons.map((reason) => (
              <div
                key={reason.id}
                className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  id={`reason-${reason.id}`}
                  checked={selectedReasons.includes(reason.id)}
                  onCheckedChange={() => handleReasonToggle(reason.id)}
                  className="mt-0.5 flex-shrink-0"
                />
                <Label
                  htmlFor={`reason-${reason.id}`}
                  className="flex-1 text-sm font-normal cursor-pointer leading-relaxed"
                >
                  {reason.label}
                </Label>
              </div>
            ))}
          </div>

          {applicableReasons.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No rejection reasons available for this task type.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isUpdating || selectedReasons.length === 0}
          >
            {isUpdating ? "Rejecting..." : "Reject Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
