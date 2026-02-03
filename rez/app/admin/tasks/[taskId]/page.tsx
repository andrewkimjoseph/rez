"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { useAdminStore } from "@/stores/admin-store";
import { useSelectedTaskStore } from "@/stores/selected-task-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  GlobeAltIcon,
  DocumentTextIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  BeakerIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import AdminEditTaskDialog from "@/components/admin/AdminEditTaskDialog";
import AdminRejectTaskDialog from "@/components/admin/AdminRejectTaskDialog";

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
        router.push("/dashboard");
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

  const handleEditSuccess = () => {
    toast.success("Task updated successfully");
    fetchAllTasks(true);
  };

  const handleReviewClick = (action: 'approve' | 'reject') => {
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
      setReviewDialogOpen(false);
      setReviewAction(null);
      toast.success(`Task ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`);
      fetchAllTasks(true);
    } else {
      toast.error(`Failed to ${reviewAction} task`);
    }
  };

  const handleCancelReview = () => {
    setReviewDialogOpen(false);
    setReviewAction(null);
  };

  const getReviewStatusBadge = (reviewStatus: string | null | undefined) => {
    switch (reviewStatus) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80 border-0">Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80 border-0">Approved</Badge>;
      case 'published':
        return <Badge className="bg-[#5C29A3]/10 text-[#5C29A3] hover:bg-[#5C29A3]/20 border-0">Published</Badge>;
      case 'archived':
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100/80 border-0">Archived</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100/80 border-0">Rejected</Badge>;
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
    return null;
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
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
                <ShieldCheckIcon className="h-6 w-6 text-primary" />
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  {formattedData.title}
                </h1>
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
              <p className="text-sm text-muted-foreground mt-2">
                Task ID: {formattedData.id}
              </p>
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card className="cursor-default">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DocumentTextIcon className="h-5 w-5 text-primary" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{formattedData.typeLabel}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Difficulty</p>
                  <p className="font-medium">{formattedData.levelOfDifficulty}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target Country</p>
                  <p className="font-medium">{formattedData.targetCountry}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rewards & Target */}
          <Card className="cursor-default">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CurrencyDollarIcon className="h-5 w-5 text-primary" />
                Rewards & Target
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Reward per Participant</p>
                  <div className="flex items-center gap-2 mt-1">
                    {formattedData.tokenInfo?.imagePath && (
                      <Image
                        src={formattedData.tokenInfo.imagePath}
                        alt={formattedData.tokenInfo.name}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    )}
                    <p className="font-medium">{formattedData.formattedReward}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target Participants</p>
                  <div className="flex items-center gap-2 mt-1">
                    <UserGroupIcon className="h-5 w-5 text-muted-foreground" />
                    <p className="font-medium">{formattedData.targetNumberOfParticipants}</p>
                  </div>
                </div>
              </div>
              {formattedData.managerContractAddress && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Contract Address</p>
                  <a
                    href={formattedData.blockscoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline font-mono text-sm break-all"
                  >
                    {formattedData.managerContractAddress}
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 flex-shrink-0" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Links */}
          <Card className="cursor-default">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <LinkIcon className="h-5 w-5 text-primary" />
                Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formattedData.link ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Task Link</p>
                  <a
                    href={formattedData.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline break-all"
                  >
                    {formattedData.link}
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 flex-shrink-0" />
                  </a>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No task link provided</p>
              )}
              {formattedData.feedback && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Feedback Form</p>
                  <a
                    href={formattedData.feedback}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline break-all"
                  >
                    {formattedData.feedback}
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 flex-shrink-0" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="cursor-default">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CogIcon className="h-5 w-5 text-primary" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Time</p>
                  <div className="flex items-center gap-2 mt-1">
                    <ClockIcon className="h-5 w-5 text-muted-foreground" />
                    <p className="font-medium">
                      {formattedData.estimatedTimeOfCompletionInMinutes} min
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cooldown Period</p>
                  <p className="font-medium mt-1">
                    {formattedData.numberOfCooldownHours} hours
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-2">
                  {formattedData.isAvailable ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm">
                    {formattedData.isAvailable ? "Available" : "Not Available"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {formattedData.isTest ? (
                    <BeakerIcon className="h-5 w-5 text-orange-500" />
                  ) : (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  )}
                  <span className="text-sm">
                    {formattedData.isTest ? "Test Task" : "Production Task"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions - Full Width */}
          {formattedData.instructions && (
            <Card className="lg:col-span-2 cursor-default">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ChartBarIcon className="h-5 w-5 text-primary" />
                  Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {formattedData.instructions}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Payment Terms - Full Width */}
          {formattedData.paymentTerms && (
            <Card className="lg:col-span-2 cursor-default">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CurrencyDollarIcon className="h-5 w-5 text-primary" />
                  Payment Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {formattedData.paymentTerms}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card className="lg:col-span-2 cursor-default">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Metadata
              </CardTitle>
              <CardDescription>
                Task creation and ownership information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created By</p>
                  <p className="font-medium">{formattedData.rezTaskMasterEmailAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Task Master ID</p>
                  <p className="font-medium font-mono text-sm truncate" title={formattedData.taskMasterId}>
                    {formattedData.taskMasterId || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="font-medium">{formattedData.timeCreated}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formattedData.timeUpdated}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                  This will make the task active and available for users to complete.
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
