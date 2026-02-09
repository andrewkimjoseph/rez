"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Task } from "@/firebase/firestore/models/Task";
import { useAdminStore, AdminUpdateTaskData } from "@/stores/admin-store";
import {
  getRejectionReasonsForTaskType,
  REJECTION_REASONS,
  getRejectionReasonLabel,
} from "@/utils/rejection-reasons";
import { ArrowPathIcon, DocumentTextIcon, LinkIcon, CurrencyDollarIcon, CogIcon, UserGroupIcon, ClipboardDocumentListIcon, DevicePhoneMobileIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supportedTokens } from "@/utils/currencies";
import Image from "next/image";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";
import { TOOLTIP_TEXTS } from "@/data/tooltip-texts";

interface AdminEditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const taskTypes = [
  { value: "fillAForm", label: "Online Survey" },
  { value: "checkOutApp", label: "Product Testing" },
];
const categories = ["Finance", "Climate", "Education", "Health", "Technology", "Social", "Other"];
const difficulties = ["Easy", "Medium", "Hard"];
const PAYMENT_TERMS_NONE = "__none__";

export default function AdminEditTaskDialog({
  task,
  open,
  onOpenChange,
  onSuccess
}: AdminEditTaskDialogProps) {
  const { updateTask, isUpdating, taskMasters, fetchAllTaskMasters } = useAdminStore();
  const {
    adminTaskEditComplete,
    adminTaskEditFailed,
    adminTaskEditCancelled,
    adminTaskApproveComplete,
    adminTaskApproveFailed,
    adminTaskRejectComplete,
    adminTaskRejectFailed,
    adminTaskPublishComplete,
    adminTaskPublishFailed,
    adminTaskArchiveComplete,
    adminTaskArchiveFailed,
  } = useAmplitudeEvents();
  const { user } = useTaskMasterStore();
  const isSuperAdmin = user?.isSuperAdmin === true;

  const [type, setType] = useState<string>("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [link, setLink] = useState("");
  const [instructions, setInstructions] = useState("");
  const [feedback, setFeedback] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<string | null>(null);
  const [targetCountry, setTargetCountry] = useState("");
  const [targetNumberOfParticipants, setTargetNumberOfParticipants] = useState<number>(0);
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(0);
  const [numberOfFeedbackQuestions, setNumberOfFeedbackQuestions] = useState<number>(0);
  const [rewardAmountPerParticipant, setRewardAmountPerParticipant] = useState<number>(0);
  const [rewardCurrencyId, setRewardCurrencyId] = useState<number>(0);
  const [estimatedTimeOfCompletionInMinutes, setEstimatedTimeOfCompletionInMinutes] = useState<number>(0);
  const [numberOfCooldownHours, setNumberOfCooldownHours] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isTest, setIsTest] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'approved' | 'rejected' | 'published' | 'archived'>('pending');
  const [reasonsForRejection, setReasonsForRejection] = useState<number[]>([]);
  const [managerContractAddress, setManagerContractAddress] = useState("");
  const [assignToTaskMaster, setAssignToTaskMaster] = useState(false);
  const [assignedTaskMasterEmailAddress, setAssignedTaskMasterEmailAddress] = useState("");

  useEffect(() => {
    if (isSuperAdmin && taskMasters.length === 0) fetchAllTaskMasters();
  }, [isSuperAdmin, taskMasters.length, fetchAllTaskMasters]);

  useEffect(() => {
    if (task) {
      setType(task.type || "");
      setTitle(task.title || "");
      setCategory(task.category || "");
      setDifficulty(task.levelOfDifficulty || "");
      setLink(task.link || "");
      setInstructions(task.instructions || "");
      setFeedback(task.feedback || "");
      setPaymentTerms(task.paymentTerms || null);
      setTargetCountry(task.targetCountry || "");
      setTargetNumberOfParticipants(task.targetNumberOfParticipants || 0);
      setNumberOfQuestions(task.numberOfQuestions || 0);
      setNumberOfFeedbackQuestions(task.numberOfFeedbackQuestions || 0);
      setRewardAmountPerParticipant(task.rewardAmountPerParticipant || 0);
      setRewardCurrencyId(task.rewardCurrencyId || 0);
      setEstimatedTimeOfCompletionInMinutes(task.estimatedTimeOfCompletionInMinutes || 0);
      setNumberOfCooldownHours(task.numberOfCooldownHours || 0);
      setIsAvailable(task.isAvailable || false);
      setIsTest(task.isTest || false);
      setReviewStatus((task.reviewStatus || 'pending') as 'pending' | 'approved' | 'rejected' | 'published' | 'archived');
      setReasonsForRejection(task.reasonsForRejection || []);
      setManagerContractAddress(task.managerContractAddress || "");
      setAssignedTaskMasterEmailAddress(task.rezTaskMasterEmailAddress || "");
      setAssignToTaskMaster(false);
    }
  }, [task]);

  const buildUpdateData = (): AdminUpdateTaskData => {
    const updateData: AdminUpdateTaskData = {};
    if (!task) return updateData;
    if (type !== task.type) updateData.type = type as AdminUpdateTaskData["type"];
    if (title !== (task.title || "")) updateData.title = title;
    if (category !== (task.category || "")) updateData.category = category;
    if (difficulty !== (task.levelOfDifficulty || "")) updateData.levelOfDifficulty = difficulty;
    if (link !== (task.link || "")) updateData.link = link;
    if (instructions !== (task.instructions || "")) updateData.instructions = instructions;
    if (feedback !== (task.feedback || "")) updateData.feedback = feedback;
    const currentPaymentTerms = task.paymentTerms || null;
    if (paymentTerms !== currentPaymentTerms) {
      updateData.paymentTerms = paymentTerms === null ? null : paymentTerms;
    }
    if (targetCountry !== (task.targetCountry || "")) updateData.targetCountry = targetCountry;
    if (targetNumberOfParticipants !== (task.targetNumberOfParticipants || 0)) updateData.targetNumberOfParticipants = targetNumberOfParticipants;
    if (numberOfQuestions !== (task.numberOfQuestions || 0)) updateData.numberOfQuestions = numberOfQuestions;
    if (numberOfFeedbackQuestions !== (task.numberOfFeedbackQuestions || 0)) updateData.numberOfFeedbackQuestions = numberOfFeedbackQuestions;
    if (rewardAmountPerParticipant !== (task.rewardAmountPerParticipant || 0)) updateData.rewardAmountPerParticipant = rewardAmountPerParticipant;
    if (rewardCurrencyId !== (task.rewardCurrencyId || 0)) updateData.rewardCurrencyId = rewardCurrencyId;
    if (estimatedTimeOfCompletionInMinutes !== (task.estimatedTimeOfCompletionInMinutes || 0)) updateData.estimatedTimeOfCompletionInMinutes = estimatedTimeOfCompletionInMinutes;
    if (numberOfCooldownHours !== (task.numberOfCooldownHours || 0)) updateData.numberOfCooldownHours = numberOfCooldownHours;
    if (isAvailable !== (task.isAvailable || false)) updateData.isAvailable = isAvailable;
    if (isTest !== (task.isTest || false)) updateData.isTest = isTest;
    if (reviewStatus !== (task.reviewStatus || 'pending')) updateData.reviewStatus = reviewStatus;
    // Handle rejection reasons: include if rejected, clear if not rejected
    if (reviewStatus === 'rejected') {
      // Only update if reasons have changed
      const currentReasons = task.reasonsForRejection || [];
      const reasonsChanged = reasonsForRejection.length !== currentReasons.length ||
        reasonsForRejection.some(r => !currentReasons.includes(r));
      if (reasonsChanged) {
        updateData.reasonsForRejection = reasonsForRejection;
      }
    } else {
      // Clear rejection reasons if status is not rejected
      if (task.reasonsForRejection && task.reasonsForRejection.length > 0) {
        updateData.reasonsForRejection = [];
      }
    }
    if (managerContractAddress !== (task.managerContractAddress || "")) updateData.managerContractAddress = managerContractAddress;
    if (isSuperAdmin && assignToTaskMaster && assignedTaskMasterEmailAddress !== (task.rezTaskMasterEmailAddress || "")) {
      updateData.rezTaskMasterEmailAddress = assignedTaskMasterEmailAddress;
    }
    return updateData;
  };

  const handleSubmit = async () => {
    if (!task?.id) return;
    
    // Validate: if rejected, must have at least one rejection reason
    if (reviewStatus === 'rejected' && reasonsForRejection.length === 0) {
      toast.error("Please select at least one rejection reason");
      return;
    }
    
    const updateData = buildUpdateData();
    if (Object.keys(updateData).length === 0) {
      toast.info("No changes detected");
      onOpenChange(false);
      return;
    }
    
    // Track review status changes
    const oldReviewStatus = task.reviewStatus || 'pending';
    const newReviewStatus = updateData.reviewStatus as string | undefined;
    const isReviewStatusChange = newReviewStatus && newReviewStatus !== oldReviewStatus;
    
    const success = await updateTask(task.id, updateData);
    if (success) {
      // Track specific review status change events
      if (isReviewStatusChange) {
        if (newReviewStatus === 'approved') {
          adminTaskApproveComplete({ 
            task_id: task.id, 
            task_title: task.title,
          });
        } else if (newReviewStatus === 'rejected') {
          adminTaskRejectComplete({ 
            task_id: task.id, 
            task_title: task.title,
            rejection_reasons_count: reasonsForRejection.length,
          });
        } else if (newReviewStatus === 'published') {
          adminTaskPublishComplete({ 
            task_id: task.id, 
            task_title: task.title,
          });
        } else if (newReviewStatus === 'archived') {
          adminTaskArchiveComplete({ 
            task_id: task.id, 
            task_title: task.title,
          });
        }
      }
      
      adminTaskEditComplete({ task_id: task.id, changed_fields: Object.keys(updateData) });
      onOpenChange(false);
      onSuccess?.();
    } else {
      // Track failed review status changes
      if (isReviewStatusChange) {
        if (newReviewStatus === 'approved') {
          adminTaskApproveFailed({ 
            task_id: task.id, 
            task_title: task.title,
            error_message: "Failed to approve task",
          });
        } else if (newReviewStatus === 'rejected') {
          adminTaskRejectFailed({ 
            task_id: task.id, 
            task_title: task.title,
            error_message: "Failed to reject task",
          });
        } else if (newReviewStatus === 'published') {
          adminTaskPublishFailed({ 
            task_id: task.id, 
            task_title: task.title,
            error_message: "Failed to publish task",
          });
        } else if (newReviewStatus === 'archived') {
          adminTaskArchiveFailed({ 
            task_id: task.id, 
            task_title: task.title,
            error_message: "Failed to archive task",
          });
        }
      }
      
      adminTaskEditFailed({ task_id: task.id, error_message: "Failed to update task" });
      toast.error("Failed to update task");
    }
  };

  const handleCancel = () => {
    if (task?.id) adminTaskEditCancelled({ task_id: task.id });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100">
          <DialogTitle className="text-lg font-semibold text-gray-900">Edit task</DialogTitle>
          <p className="text-xs text-gray-500 mt-0.5">ID: {task?.id}</p>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-gray-100 bg-transparent p-0 h-auto gap-0">
            <TabsTrigger value="basic" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#5C29A3] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-500 data-[state=active]:text-[#5C29A3]">
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="content" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#5C29A3] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-500 data-[state=active]:text-[#5C29A3]">
              <LinkIcon className="w-4 h-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="rewards" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#5C29A3] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-500 data-[state=active]:text-[#5C29A3]">
              <CurrencyDollarIcon className="w-4 h-4 mr-2" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#5C29A3] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-500 data-[state=active]:text-[#5C29A3]">
              <CogIcon className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <div className="px-6 py-4">
            <TooltipProvider delayDuration={200}>
            {/* Basic */}
            <TabsContent value="basic" className="mt-0">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Basic info</h3>
                <p className="text-xs text-gray-500 mt-0.5">Type, title, category, and targeting</p>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Type</p>
                  <div className="flex gap-2 flex-wrap">
                    {taskTypes.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => type !== "doVideoInterview" && setType(t.value)}
                        className={`px-3 py-2 rounded-lg border text-left text-sm transition-all ${
                          type === t.value ? "border-[#5C29A3] bg-[#5C29A3]/5 text-[#5C29A3]" : "border-gray-200 hover:border-gray-300"
                        } ${type === "doVideoInterview" ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        {t.value === "fillAForm" ? <ClipboardDocumentListIcon className="w-4 h-4 inline mr-1.5 -mt-0.5" /> : <DevicePhoneMobileIcon className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
                        {t.label}
                      </button>
                    ))}
                    {task?.type === "doVideoInterview" && (
                      <span className="text-xs text-gray-400 self-center">Video Interview (read-only)</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Label htmlFor="edit-title" className="text-xs font-medium text-gray-500">Title</Label>
                    {title && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Task title">
                          <InformationCircleIcon className="w-3.5 h-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">
                        {TOOLTIP_TEXTS.titleAdmin}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Recycling Habits & Digital Rewards" className="h-9 text-sm" />
                  <p className="text-[11px] text-gray-400 mt-1">Shown to participants in the task list</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Label htmlFor="edit-category" className="text-xs font-medium text-gray-500">Category</Label>
                      {category && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Category">
                            <InformationCircleIcon className="w-3.5 h-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          {TOOLTIP_TEXTS.categoryAdmin}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Label htmlFor="edit-difficulty" className="text-xs font-medium text-gray-500">Difficulty</Label>
                      {difficulty && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Difficulty">
                            <InformationCircleIcon className="w-3.5 h-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          {TOOLTIP_TEXTS.difficultyAdmin}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Difficulty" /></SelectTrigger>
                      <SelectContent>{difficulties.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Label htmlFor="edit-target-country" className="text-xs font-medium text-gray-500">Target country</Label>
                    {targetCountry && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Target country">
                          <InformationCircleIcon className="w-3.5 h-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">
                        {TOOLTIP_TEXTS.targetCountry}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input id="edit-target-country" value={targetCountry} onChange={(e) => setTargetCountry(e.target.value)} placeholder="ALL or KE, NG, ..." className="h-9 text-sm" />
                  <p className="text-[11px] text-gray-400 mt-1">ALL = everyone; otherwise list country codes</p>
                </div>
              </div>
            </TabsContent>

            {/* Content */}
            <TabsContent value="content" className="mt-0">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Content</h3>
                <p className="text-xs text-gray-500 mt-0.5">Links, instructions, and payment terms</p>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Label htmlFor="edit-link" className="text-xs font-medium text-gray-500">Task link / URL</Label>
                    {link && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Task link">
                          <InformationCircleIcon className="w-3.5 h-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">
                        {TOOLTIP_TEXTS.link}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input id="edit-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className="h-9 text-sm" />
                  <p className="text-[11px] text-gray-400 mt-1">Must be a valid URL</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Label htmlFor="edit-instructions" className="text-xs font-medium text-gray-500">Instructions</Label>
                    {instructions && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Instructions">
                          <InformationCircleIcon className="w-3.5 h-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">
                        {TOOLTIP_TEXTS.instructions}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Textarea id="edit-instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Step-by-step instructions..." rows={3} className="text-sm resize-none min-h-[72px]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Label htmlFor="edit-feedback" className="text-xs font-medium text-gray-500">Feedback form URL</Label>
                    {feedback && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Feedback form">
                          <InformationCircleIcon className="w-3.5 h-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">
                        {TOOLTIP_TEXTS.feedback}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input id="edit-feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="https://..." className="h-9 text-sm" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Label htmlFor="edit-payment-terms" className="text-xs font-medium text-gray-500">Payment terms</Label>
                    {paymentTerms && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Payment terms">
                          <InformationCircleIcon className="w-3.5 h-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">
                        {TOOLTIP_TEXTS.paymentTerms}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={paymentTerms ?? PAYMENT_TERMS_NONE} onValueChange={(value) => setPaymentTerms(value === PAYMENT_TERMS_NONE ? null : value)}>
                    <SelectTrigger id="edit-payment-terms" className="h-9 text-sm">
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PAYMENT_TERMS_NONE}>Not specified</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                      <SelectItem value="instant">Instant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Rewards */}
            <TabsContent value="rewards" className="mt-0">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Rewards</h3>
                <p className="text-xs text-gray-500 mt-0.5">Participants, questions, reward amount, and currency</p>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Label htmlFor="edit-target-participants" className="text-xs font-medium text-gray-500">Target participants</Label>
                    {targetNumberOfParticipants > 0 && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Target participants">
                          <InformationCircleIcon className="w-3.5 h-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">
                        {TOOLTIP_TEXTS.targetNumberOfParticipants}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input id="edit-target-participants" type="number" min={0} value={targetNumberOfParticipants || ""} onChange={(e) => setTargetNumberOfParticipants(Number(e.target.value) || 0)} className="h-9 text-sm" />
                  <p className="text-[11px] text-gray-400 mt-1">Survey: participants; Product test: testers</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Label htmlFor="edit-num-questions" className="text-xs font-medium text-gray-500">Questions</Label>
                      {(numberOfQuestions ?? 0) > 0 && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Questions">
                            <InformationCircleIcon className="w-3.5 h-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          {TOOLTIP_TEXTS.numberOfQuestions}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input id="edit-num-questions" type="number" min={0} value={numberOfQuestions ?? ""} onChange={(e) => setNumberOfQuestions(Number(e.target.value) || 0)} className="h-9 text-sm" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Label htmlFor="edit-num-feedback" className="text-xs font-medium text-gray-500">Feedback questions</Label>
                      {(numberOfFeedbackQuestions ?? 0) > 0 && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Feedback questions">
                            <InformationCircleIcon className="w-3.5 h-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          {TOOLTIP_TEXTS.numberOfFeedbackQuestions}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input id="edit-num-feedback" type="number" min={0} value={numberOfFeedbackQuestions ?? ""} onChange={(e) => setNumberOfFeedbackQuestions(Number(e.target.value) || 0)} className="h-9 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Label htmlFor="edit-reward-amount" className="text-xs font-medium text-gray-500">Reward per participant</Label>
                      {(rewardAmountPerParticipant ?? 0) > 0 && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Reward amount">
                            <InformationCircleIcon className="w-3.5 h-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          {TOOLTIP_TEXTS.rewardAmountPerParticipant}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input id="edit-reward-amount" type="number" min={0} step={0.01} value={rewardAmountPerParticipant ?? ""} onChange={(e) => setRewardAmountPerParticipant(Number(e.target.value) || 0)} className="h-9 text-sm" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Label htmlFor="edit-reward-currency" className="text-xs font-medium text-gray-500">Currency</Label>
                      {rewardCurrencyId > 0 && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Currency">
                            <InformationCircleIcon className="w-3.5 h-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          {TOOLTIP_TEXTS.rewardCurrencyId}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select value={rewardCurrencyId?.toString() ?? ""} onValueChange={(v) => setRewardCurrencyId(Number(v) || 0)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Currency" /></SelectTrigger>
                      <SelectContent>
                        {Object.values(supportedTokens).map((token) => (
                          <SelectItem key={token.id} value={token.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Image src={token.imagePath} alt={token.name} width={16} height={16} className="rounded-full" />
                              <span>{token.symbol}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Label htmlFor="edit-contract" className="text-xs font-medium text-gray-500">Manager contract address</Label>
                    {managerContractAddress && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Contract address">
                          <InformationCircleIcon className="w-3.5 h-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">
                        {TOOLTIP_TEXTS.managerContractAddress}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input id="edit-contract" value={managerContractAddress} onChange={(e) => setManagerContractAddress(e.target.value)} placeholder="0x..." className="h-9 text-sm" />
                </div>
              </div>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="mt-0">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Settings</h3>
                <p className="text-xs text-gray-500 mt-0.5">Time, review status, availability, and assignment</p>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Label htmlFor="edit-estimated-time" className="text-xs font-medium text-gray-500">Est. time (min)</Label>
                      {(estimatedTimeOfCompletionInMinutes ?? 0) > 0 && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Estimated time">
                            <InformationCircleIcon className="w-3.5 h-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          {TOOLTIP_TEXTS.estimatedTimeOfCompletion}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input id="edit-estimated-time" type="number" min={0} value={estimatedTimeOfCompletionInMinutes ?? ""} onChange={(e) => setEstimatedTimeOfCompletionInMinutes(Number(e.target.value) || 0)} className="h-9 text-sm" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Label htmlFor="edit-cooldown" className="text-xs font-medium text-gray-500">Cooldown (hours)</Label>
                      {(numberOfCooldownHours ?? 0) > 0 && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Cooldown">
                            <InformationCircleIcon className="w-3.5 h-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          {TOOLTIP_TEXTS.numberOfCooldownHours}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input id="edit-cooldown" type="number" min={0} value={numberOfCooldownHours ?? ""} onChange={(e) => setNumberOfCooldownHours(Number(e.target.value) || 0)} className="h-9 text-sm" />
                    <p className="text-[11px] text-gray-400 mt-1">0 = no cooldown</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Label htmlFor="edit-review-status" className="text-xs font-medium text-gray-500">Review status</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Review status">
                          <InformationCircleIcon className="w-3.5 h-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">
                        {TOOLTIP_TEXTS.reviewStatus}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select 
                    value={reviewStatus} 
                    onValueChange={(v) => {
                      const newStatus = v as typeof reviewStatus;
                      setReviewStatus(newStatus);
                      // Clear rejection reasons if changing away from rejected
                      if (newStatus !== 'rejected') {
                        setReasonsForRejection([]);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Pending</span></SelectItem>
                      <SelectItem value="approved"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /> Approved</span></SelectItem>
                      <SelectItem value="published"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#5C29A3]" /> Published</span></SelectItem>
                      <SelectItem value="archived"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-500" /> Archived</span></SelectItem>
                      <SelectItem value="rejected"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> Rejected</span></SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {reviewStatus === "published" && "Active for participants."}
                    {reviewStatus === "approved" && "Publish to make active."}
                    {reviewStatus === "archived" && "Complete, no longer active."}
                    {reviewStatus === "rejected" && "Task was rejected."}
                    {reviewStatus === "pending" && "Awaiting review."}
                  </p>
                </div>

                {/* Rejection Reasons - Show when status is rejected */}
                {reviewStatus === "rejected" && (
                  <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Label className="text-xs font-medium text-gray-700">Rejection reasons</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Rejection reasons">
                            <InformationCircleIcon className="w-3.5 h-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          {TOOLTIP_TEXTS.reasonsForRejection}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {getRejectionReasonsForTaskType(type || null).map((reason) => {
                        const isSelected = reasonsForRejection.includes(reason.id);
                        return (
                          <div
                            key={reason.id}
                            className="flex items-start space-x-2 p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <Checkbox
                              id={`rejection-reason-${reason.id}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setReasonsForRejection([...reasonsForRejection, reason.id]);
                                } else {
                                  setReasonsForRejection(reasonsForRejection.filter((id) => id !== reason.id));
                                }
                              }}
                              className="mt-0.5 flex-shrink-0"
                            />
                            <Label
                              htmlFor={`rejection-reason-${reason.id}`}
                              className="flex-1 text-xs font-normal cursor-pointer leading-relaxed text-gray-700"
                            >
                              {reason.label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                    {reasonsForRejection.length === 0 && (
                      <p className="text-xs text-red-600 mt-2">⚠️ At least one rejection reason should be selected.</p>
                    )}
                  </div>
                )}

                <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Task available</p>
                      <p className="text-[11px] text-gray-500">Visible to participants</p>
                    </div>
                    <Switch id="edit-available" checked={isAvailable} onCheckedChange={setIsAvailable} disabled={reviewStatus !== "published"} />
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Test task</p>
                      <p className="text-[11px] text-gray-500">No real rewards</p>
                    </div>
                    <Switch id="edit-test" checked={isTest} onCheckedChange={setIsTest} />
                  </div>
                </div>

                {isSuperAdmin && (
                  <div className="rounded-lg border border-[#5C29A3]/20 bg-[#5C29A3]/5 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-4 h-4 text-[#5C29A3]" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Assign to task master</p>
                          <p className="text-[11px] text-gray-500">Reassign this task</p>
                        </div>
                      </div>
                      <Switch checked={assignToTaskMaster} onCheckedChange={(c) => { setAssignToTaskMaster(c); if (!c) setAssignedTaskMasterEmailAddress(task?.rezTaskMasterEmailAddress || ""); }} />
                    </div>
                    {assignToTaskMaster && (
                      <div className="px-3 pb-3 pt-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Label htmlFor="edit-assign-select" className="text-xs font-medium text-gray-500">Task master</Label>
                          {assignedTaskMasterEmailAddress && <CheckCircleSolidIcon className="w-3.5 h-3.5 text-green-500" />}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex text-gray-400 hover:text-gray-600 cursor-help" aria-label="Assign task master">
                                <InformationCircleIcon className="w-3.5 h-3.5" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[220px]">
                              {TOOLTIP_TEXTS.rezTaskMasterEmailAddress}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {taskMasters.length > 0 ? (
                          <Select value={assignedTaskMasterEmailAddress} onValueChange={setAssignedTaskMasterEmailAddress}>
                            <SelectTrigger id="edit-assign-select" className="h-9 text-sm mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent>
                              {taskMasters.filter((tm) => tm.emailAddress && tm.emailAddress !== user?.emailAddress).map((tm) => (
                                <SelectItem key={tm.id} value={tm.emailAddress || ""}>{tm.name || tm.emailAddress} · {tm.emailAddress}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">Loading...</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
            </TooltipProvider>
          </div>
        </Tabs>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleCancel} disabled={isUpdating}>Cancel</Button>
          <Button 
            size="sm" 
            onClick={handleSubmit} 
            disabled={isUpdating || (reviewStatus === 'rejected' && reasonsForRejection.length === 0)}
          >
            {isUpdating ? <><ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
