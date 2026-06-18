"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { useAdminStore } from "@/stores/admin-store";
import { useSelectedTaskStore } from "@/stores/selected-task-store";
import { Task } from "@/firebase/firestore/models/Task";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheckIcon,
  TrashIcon,
  PencilIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  BeakerIcon,
  ArrowTopRightOnSquareIcon,
  ChartBarIcon,
  ClipboardDocumentIcon,
  PowerIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import AdminEditTaskDialog from "@/components/admin/AdminEditTaskDialog";
import AdminRejectTaskDialog from "@/components/admin/AdminRejectTaskDialog";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";


export default function AdminTaskDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params?.taskId as string;

  const { user } = useTaskMasterStore();
  const {
    tasks,
    isLoadingTasks,
    isDeleting,
    isUpdating,
    fetchAllTasks,
    deleteTask,
    updateTask,
  } = useAdminStore();
  const { task, formattedData, setTask } = useSelectedTaskStore();

  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const [paymentTermsExpanded, setPaymentTermsExpanded] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'publish' | 'activate' | 'deactivate' | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && user) {
      if (user.isSuperAdmin) {
        setIsAuthorized(true);
        fetchAllTasks();
      } else {
        setIsAuthorized(false);
      }
    } else if (isHydrated && !user) {
      router.push("/sign-in");
    }
  }, [isHydrated, user, router, fetchAllTasks]);

  // Set the selected task when tasks are loaded
  useEffect(() => {
    if (tasks.length > 0 && taskId) {
      const foundTask = tasks.find((t) => t.id === taskId);
      if (foundTask) {
        setTask(foundTask);
      }
    }
  }, [tasks, taskId, setTask]);

  const handleConfirmDelete = async () => {
    if (!task?.id) return;

    const success = await deleteTask(task.id);
    if (success) {
      setDeleteDialogOpen(false);
      toast.success("Task deleted successfully");
      router.push("/admin/tasks");
    } else {
      toast.error("Failed to delete task");
    }
  };

  const handleEditSuccess = (updatedTask?: Task) => {
    toast.success("Task updated successfully");
    if (updatedTask) {
      setTask(updatedTask);
    } else {
      const fromStore = useAdminStore.getState().tasks.find((t) => t.id === taskId);
      if (fromStore) setTask(fromStore);
    }
  };

  const {
    adminTaskApproveClicked,
    adminTaskApproveComplete,
    adminTaskApproveFailed,
    adminTaskRejectClicked,
    adminTaskRejectComplete,
    adminTaskRejectFailed,
    adminTaskPublishClicked,
    adminTaskPublishComplete,
    adminTaskPublishFailed,
    adminTaskActivateClicked,
    adminTaskActivateComplete,
    adminTaskActivateFailed,
    adminTaskDeactivateClicked,
    adminTaskDeactivateComplete,
    adminTaskDeactivateFailed,
  } = useAmplitudeEvents();

  const handleReviewClick = (action: 'approve' | 'reject') => {
    if (action === 'approve') {
      adminTaskApproveClicked({ task_id: task?.id, task_title: task?.title });
    } else {
      adminTaskRejectClicked({ task_id: task?.id, task_title: task?.title });
    }
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const handleConfirmReview = async (rejectionReasons?: number[]) => {
    if (!task?.id || !reviewAction) return;

    const updateData: any = { reviewStatus: reviewAction === 'approve' ? 'approved' : 'rejected' };
    
    // Include rejection reasons if rejecting
    if (reviewAction === 'reject' && rejectionReasons && rejectionReasons.length > 0) {
      updateData.reasonsForRejection = rejectionReasons;
    }
    
    // Clear rejection reasons if approving
    if (reviewAction === 'approve') {
      updateData.reasonsForRejection = [];
    }

    const success = await updateTask(task.id, updateData);
    if (success) {
      if (reviewAction === 'approve') {
        adminTaskApproveComplete({
          task_id: task.id,
          task_title: task.title,
        });
      } else {
        adminTaskRejectComplete({
          task_id: task.id,
          task_title: task.title,
          rejection_reasons_count: rejectionReasons?.length || 0,
        });
      }
      setReviewDialogOpen(false);
      setReviewAction(null);
      toast.success(`Task ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`);
      // Update selected task so UI reflects new state immediately (refetched list may be paginated)
      setTask({ ...task, ...updateData });
      await fetchAllTasks(true, true);
    } else {
      if (reviewAction === 'approve') {
        adminTaskApproveFailed({ 
          task_id: task.id, 
          task_title: task.title,
          error_message: "Failed to approve task",
        });
      } else {
        adminTaskRejectFailed({ 
          task_id: task.id, 
          task_title: task.title,
          error_message: "Failed to reject task",
        });
      }
      toast.error(`Failed to ${reviewAction} task`);
    }
  };

  const handleCancelReview = () => {
    setReviewDialogOpen(false);
    setReviewAction(null);
  };

  const handleOpenPublishDialog = () => {
    if (!task) return;
    setActionType('publish');
    setPublishDialogOpen(true);
  };

  const handleOpenActivateDialog = () => {
    if (!task) return;
    const isActive = formattedData?.isAvailable ?? false;
    setActionType(isActive ? 'deactivate' : 'activate');
    setPublishDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!task?.id || !formattedData || !actionType) return;

    let payload: any;
    let successMessage: string;
    let errorMessage: string;

    if (actionType === 'publish') {
      // Publish: approved → published
      payload = { reviewStatus: 'published' as const };
      successMessage = 'Task published';
      errorMessage = 'Failed to publish task';
      adminTaskPublishClicked({ task_id: task.id, task_title: task.title });
    } else if (actionType === 'activate') {
      // Activate: published + inactive → active
      payload = { isAvailable: true };
      successMessage = 'Task activated';
      errorMessage = 'Failed to activate task';
      adminTaskActivateClicked({ task_id: task.id, task_title: task.title });
    } else {
      // Deactivate: published + active → inactive
      payload = { isAvailable: false };
      successMessage = 'Task deactivated';
      errorMessage = 'Failed to deactivate task';
      adminTaskDeactivateClicked({ task_id: task.id, task_title: task.title });
    }

    const success = await updateTask(task.id, payload);
    if (success) {
      if (actionType === 'publish') {
        adminTaskPublishComplete({
          task_id: task.id,
          task_title: task.title,
        });
      } else if (actionType === 'activate') {
        adminTaskActivateComplete({ task_id: task.id });
      } else {
        adminTaskDeactivateComplete({ task_id: task.id });
      }
      toast.success(successMessage);
      setPublishDialogOpen(false);
      setActionType(null);
      // Update selected task in store so UI reflects new state immediately (refetched list may be paginated)
      setTask({ ...task, ...payload });
      await fetchAllTasks(true, true);
    } else {
      if (actionType === 'publish') {
        adminTaskPublishFailed({
          task_id: task.id,
          task_title: task.title,
          error_message: errorMessage,
        });
      } else if (actionType === 'activate') {
        adminTaskActivateFailed({
          task_id: task.id,
          error_message: errorMessage,
        });
      } else {
        adminTaskDeactivateFailed({
          task_id: task.id,
          error_message: errorMessage,
        });
      }
      toast.error(errorMessage);
    }
  };

  const handleCancelAction = () => {
    setPublishDialogOpen(false);
    setActionType(null);
  };

  const handleConfirmArchive = async () => {
    if (!task?.id) return;
    const success = await updateTask(task.id, { reviewStatus: 'archived' });
    if (success) {
      setTask({ ...task, reviewStatus: 'archived' });
      setArchiveDialogOpen(false);
      toast.success("Task archived");
      await fetchAllTasks(true, true);
    } else {
      toast.error("Failed to archive task");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Failed to copy")
    );
  };

  const getReviewStatusBadge = (reviewStatus: string | null | undefined) => {
    const badgeClass = "shrink-0 whitespace-nowrap border-0";
    switch (reviewStatus) {
      case 'pending':
        return <Badge variant="outline" className={`${badgeClass} bg-yellow-100 text-yellow-700`}>Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className={`${badgeClass} bg-green-100 text-green-700`}>Approved</Badge>;
      case 'published':
        return <Badge variant="outline" className={`${badgeClass} bg-[#5C29A3]/10 text-[#5C29A3]`}>Published</Badge>;
      case 'archived':
        return <Badge variant="outline" className={`${badgeClass} bg-slate-100 text-slate-700`}>Archived</Badge>;
      case 'rejected':
        return <Badge variant="outline" className={`${badgeClass} bg-red-100 text-red-700`}>Rejected</Badge>;
      default:
        return <Badge variant="outline">N/A</Badge>;
    }
  };

  if (!isHydrated || isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthorized === false) {
    return <AdminAccessDenied />;
  }

  if (isLoadingTasks && !task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">Loading task details...</p>
      </div>
    );
  }

  if (!task || !formattedData) {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="space-y-6">
          <Link
            href="/admin/tasks"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-sm">Back to All Tasks</span>
          </Link>
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-3 rounded-full bg-muted mb-3">
              <XCircleIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">Task not found</p>
            <p className="text-sm text-muted-foreground mt-1">
              The task you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href="/admin/tasks"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-sm">Back to All Tasks</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheckIcon className="h-6 w-6 text-primary shrink-0" />
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  {formattedData.title}
                </h1>
                {formattedData.title && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formattedData.title ?? "", "Title")}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copy title"
                    aria-label="Copy task title"
                  >
                    <ClipboardDocumentIcon className="h-5 w-5" aria-hidden />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{formattedData.typeLabel}</Badge>
                {getReviewStatusBadge(task.reviewStatus)}
                <Badge
                  variant={formattedData.isAvailable ? "default" : "secondary"}
                  className={
                    formattedData.isAvailable
                      ? "bg-[#EFECFD] text-[#5C29A3] hover:bg-[#EFECFD]/80 border-0"
                      : ""
                  }
                >
                  {formattedData.isAvailable ? "Active" : "Inactive"}
                </Badge>
                {formattedData.isTest && (
                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100/80 border-0">
                    Test Task
                  </Badge>
                )}
              </div>
              <div className="py-3 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Task ID:</span>
                <button
                  onClick={() => copyToClipboard(formattedData.id, "Task ID")}
                  className="group/copy flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
                >
                  <span>{formattedData.id}</span>
                  <ClipboardDocumentIcon className="h-4 w-4 shrink-0 text-muted-foreground opacity-50 group-hover/copy:opacity-100 transition-opacity" aria-hidden />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {task.reviewStatus === 'pending' && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleReviewClick('approve')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReviewClick('reject')}
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
              {task.reviewStatus === 'approved' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleOpenPublishDialog}
                >
                  <PowerIcon className="h-4 w-4 mr-2 text-white" />
                  Publish
                </Button>
              )}
              {task.reviewStatus === 'published' && (
                <Button
                  variant={formattedData.isAvailable ? "secondary" : "default"}
                  size="sm"
                  onClick={handleOpenActivateDialog}
                >
                  <PowerIcon className={`h-4 w-4 mr-2 ${formattedData.isAvailable ? '' : 'text-white'}`} />
                  {formattedData.isAvailable ? 'Deactivate' : 'Activate'}
                </Button>
              )}
              {(task.reviewStatus === 'published' || task.reviewStatus === 'approved') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setArchiveDialogOpen(true)}
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Dense Key-Value Grid */}
        <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2.5 p-4 rounded-lg border bg-muted/30">
          <div>
            <dt className="text-xs text-muted-foreground">Type</dt>
            <dd className="font-medium text-sm mt-0.5">{formattedData.typeLabel}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Difficulty</dt>
            <dd className="font-medium text-sm mt-0.5">{formattedData.levelOfDifficulty}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Target Country</dt>
            <dd className="font-medium text-sm mt-0.5">{formattedData.targetCountry}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Reward</dt>
            <dd className="flex items-center gap-1.5 font-medium text-sm mt-0.5">
              {formattedData.tokenInfo?.imagePath && (
                <Image
                  src={formattedData.tokenInfo.imagePath}
                  alt={formattedData.tokenInfo.name}
                  width={16}
                  height={16}
                  className="rounded-full"
                />
              )}
              {formattedData.formattedReward}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Deadline</dt>
            <dd className="flex items-center gap-1.5 font-medium text-sm mt-0.5">
              <ClockIcon className="h-3.5 w-3.5 text-muted-foreground" />
              {formattedData.deadline}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Cooldown</dt>
            <dd className="font-medium text-sm mt-0.5">{formattedData.numberOfCooldownHours} hours</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Target Participants</dt>
            <dd className="flex items-center gap-1.5 font-medium text-sm mt-0.5">
              <UserGroupIcon className="h-3.5 w-3.5 text-muted-foreground" />
              {formattedData.targetNumberOfParticipants}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Task Manager Contract Address</dt>
            <dd className="mt-0.5 min-w-0">
              {formattedData.managerContractAddress ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  <a
                    href={formattedData.blockscoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-xs min-w-0"
                    title={formattedData.managerContractAddress}
                  >
                    <span className="truncate min-w-0 flex-1">
                      {formattedData.managerContractAddress}
                    </span>
                    <ArrowTopRightOnSquareIcon className="h-3 w-3 flex-shrink-0" />
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        formattedData.managerContractAddress ?? "",
                        "Contract address"
                      )
                    }
                    className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copy contract address"
                    aria-label="Copy contract address"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Task Link</dt>
            <dd className="mt-0.5">
              {formattedData.link ? (
                <a
                  href={formattedData.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline text-xs break-all"
                >
                  {formattedData.link}
                  <ArrowTopRightOnSquareIcon className="h-3 w-3 flex-shrink-0" />
                </a>
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Feedback Form</dt>
            <dd className="mt-0.5">
              {formattedData.feedback ? (
                <a
                  href={formattedData.feedback}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline text-xs break-all"
                >
                  {formattedData.feedback}
                  <ArrowTopRightOnSquareIcon className="h-3 w-3 flex-shrink-0" />
                </a>
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Available</dt>
            <dd className="flex items-center gap-1.5 font-medium text-sm mt-0.5">
              {formattedData.isAvailable ? (
                <CheckCircleIcon className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <XCircleIcon className="h-3.5 w-3.5 text-red-500" />
              )}
              {formattedData.isAvailable ? "Yes" : "No"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Test</dt>
            <dd className="flex items-center gap-1.5 font-medium text-sm mt-0.5">
              {formattedData.isTest ? (
                <BeakerIcon className="h-3.5 w-3.5 text-orange-500" />
              ) : (
                <CheckCircleIcon className="h-3.5 w-3.5 text-green-600" />
              )}
              {formattedData.isTest ? "Yes" : "No"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Created By</dt>
            <dd className="font-medium text-sm mt-0.5 flex items-center gap-1.5">
              <span>{formattedData.rezTaskMasterEmailAddress || "—"}</span>
              {formattedData.rezTaskMasterEmailAddress && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(formattedData.rezTaskMasterEmailAddress ?? "", "Email")}
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Copy email"
                  aria-label="Copy email address"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" aria-hidden />
                </button>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Task Master ID</dt>
            <dd className="font-medium font-mono text-xs mt-0.5 truncate" title={formattedData.taskMasterId}>
              {formattedData.taskMasterId || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Created At</dt>
            <dd className="font-medium text-sm mt-0.5">{formattedData.timeCreated}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Last Updated</dt>
            <dd className="font-medium text-sm mt-0.5">{formattedData.timeUpdated}</dd>
          </div>
        </dl>

        {/* Instructions - Truncated with expand */}
        {formattedData.instructions && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ChartBarIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Instructions</span>
            </div>
            <p
              className={`text-sm text-foreground whitespace-pre-wrap leading-relaxed ${
                instructionsExpanded ? "" : "line-clamp-3 overflow-hidden"
              }`}
            >
              {formattedData.instructions}
            </p>
            <button
              type="button"
              onClick={() => setInstructionsExpanded(!instructionsExpanded)}
              className="text-xs text-primary hover:underline mt-1"
            >
              {instructionsExpanded ? "Show less" : "Show more"}
            </button>
          </div>
        )}

        {/* Publish / Activate / Deactivate Confirmation Dialog */}
        <Dialog open={publishDialogOpen} onOpenChange={(open) => {
          if (!open) {
            handleCancelAction();
          } else {
            setPublishDialogOpen(true);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'publish' && 'Publish Task'}
                {actionType === 'activate' && 'Activate Task'}
                {actionType === 'deactivate' && 'Deactivate Task'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'publish' && (
                  <>
                    Are you sure you want to publish &quot;{formattedData.title || 'this task'}&quot;?
                    The task will be marked as Published. This does not automatically activate the task or change its availability.
                  </>
                )}
                {actionType === 'activate' && (
                  <>
                    Are you sure you want to activate &quot;{formattedData.title || 'this task'}&quot;?
                    The task will become active and available for participants to complete.
                  </>
                )}
                {actionType === 'deactivate' && (
                  <>
                    Are you sure you want to deactivate &quot;{formattedData.title || 'this task'}&quot;?
                    The task will no longer be active and available for participants.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancelAction}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                variant={actionType === 'deactivate' ? "secondary" : "default"}
                onClick={handleConfirmAction}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    {actionType === 'publish' && 'Publish'}
                    {actionType === 'activate' && 'Activate'}
                    {actionType === 'deactivate' && 'Deactivate'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Archive Confirmation Dialog */}
        <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Archive Task</DialogTitle>
              <DialogDescription>
                Are you sure you want to archive &quot;{formattedData.title || 'this task'}&quot;?
                The task will be marked as Archived and no longer appear in active lists.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setArchiveDialogOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleConfirmArchive}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Archiving...
                  </>
                ) : (
                  <>
                    <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                    Archive
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Terms - Truncated with expand */}
        {formattedData.paymentTerms && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CurrencyDollarIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Payment Terms</span>
            </div>
            <p
              className={`text-sm text-foreground whitespace-pre-wrap leading-relaxed ${
                paymentTermsExpanded ? "" : "line-clamp-3 overflow-hidden"
              }`}
            >
              {formattedData.paymentTerms}
            </p>
            <button
              type="button"
              onClick={() => setPaymentTermsExpanded(!paymentTermsExpanded)}
              className="text-xs text-primary hover:underline mt-1"
            >
              {paymentTermsExpanded ? "Show less" : "Show more"}
            </button>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Task</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{formattedData.title}&quot;?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Task Dialog */}
        <AdminEditTaskDialog
          task={task}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleEditSuccess}
        />

        {/* Review Confirmation Dialog */}
        {reviewAction === 'reject' ? (
          <AdminRejectTaskDialog
            task={task}
            open={reviewDialogOpen}
            onOpenChange={setReviewDialogOpen}
            onConfirm={(reasons) => handleConfirmReview(reasons)}
            isUpdating={isUpdating}
          />
        ) : (
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approve Task</DialogTitle>
                <DialogDescription>
                  Are you sure you want to approve &quot;{formattedData.title}&quot;?
                  The task will be marked as Approved. It will not be visible to participants until it is published.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleCancelReview}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleConfirmReview()}
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isUpdating ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    'Approve'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
