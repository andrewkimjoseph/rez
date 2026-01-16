"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Task } from "@/firebase/firestore/models/Task";
import { useAdminStore, AdminUpdateTaskData } from "@/stores/admin-store";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supportedTokens } from "@/utils/currencies";
import Image from "next/image";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";

interface AdminEditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const taskTypes = [
  { value: "fillAForm", label: "Fill a Form", description: "Users fill out forms or surveys" },
  { value: "checkOutApp", label: "Check Out App", description: "Users test and explore applications" },
];

const categories = ["Finance", "Climate", "Education", "Health", "Technology", "Social", "Other"];
const difficulties = ["Easy", "Medium", "Hard"];

export default function AdminEditTaskDialog({
  task,
  open,
  onOpenChange,
  onSuccess
}: AdminEditTaskDialogProps) {
  const { updateTask, isUpdating } = useAdminStore();
  const {
    adminTaskEditComplete,
    adminTaskEditFailed,
    adminTaskEditCancelled,
  } = useAmplitudeEvents();
  
  // Basic Info
  const [type, setType] = useState<string>("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  
  // Links & Content
  const [link, setLink] = useState("");
  const [instructions, setInstructions] = useState("");
  const [feedback, setFeedback] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  
  // Targeting
  const [targetCountry, setTargetCountry] = useState("");
  const [targetNumberOfParticipants, setTargetNumberOfParticipants] = useState<number>(0);
  
  // Rewards
  const [rewardAmountPerParticipant, setRewardAmountPerParticipant] = useState<number>(0);
  const [rewardCurrencyId, setRewardCurrencyId] = useState<number>(0);
  
  // Settings
  const [estimatedTimeOfCompletionInMinutes, setEstimatedTimeOfCompletionInMinutes] = useState<number>(0);
  const [numberOfCooldownHours, setNumberOfCooldownHours] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isTest, setIsTest] = useState(false);
  
  // Contract
  const [managerContractAddress, setManagerContractAddress] = useState("");
  
  // Task Master Assignment (Super Admin only)
  const [assignToTaskMaster, setAssignToTaskMaster] = useState(false);
  const [assignedTaskMasterEmailAddress, setAssignedTaskMasterEmailAddress] = useState("");
  const { user } = useTaskMasterStore();
  const { taskMasters, fetchAllTaskMasters } = useAdminStore();
  const isSuperAdmin = user?.isSuperAdmin === true;

  // Fetch task masters if super admin
  useEffect(() => {
    if (isSuperAdmin && taskMasters.length === 0) {
      fetchAllTaskMasters();
    }
  }, [isSuperAdmin, taskMasters.length, fetchAllTaskMasters]);

  // Initialize form with task data when task changes
  useEffect(() => {
    if (task) {
      setType(task.type || "");
      setTitle(task.title || "");
      setCategory(task.category || "");
      setDifficulty(task.levelOfDifficulty || "");
      setLink(task.link || "");
      setInstructions(task.instructions || "");
      setFeedback(task.feedback || "");
      setPaymentTerms(task.paymentTerms || "");
      setTargetCountry(task.targetCountry || "");
      setTargetNumberOfParticipants(task.targetNumberOfParticipants || 0);
      setRewardAmountPerParticipant(task.rewardAmountPerParticipant || 0);
      setRewardCurrencyId(task.rewardCurrencyId || 0);
      setEstimatedTimeOfCompletionInMinutes(task.estimatedTimeOfCompletionInMinutes || 0);
      setNumberOfCooldownHours(task.numberOfCooldownHours || 0);
      setIsAvailable(task.isAvailable || false);
      setIsTest(task.isTest || false);
      setManagerContractAddress(task.managerContractAddress || "");
      // Initialize task master assignment
      setAssignedTaskMasterEmailAddress(task.rezTaskMasterEmailAddress || "");
      setAssignToTaskMaster(false); // Start with unchecked
    }
  }, [task]);

  const handleSubmit = async () => {
    if (!task?.id) return;

    const updateData: AdminUpdateTaskData = {};
    
    // Only include changed fields
    if (type !== task.type) updateData.type = type as AdminUpdateTaskData["type"];
    if (title !== (task.title || "")) updateData.title = title;
    if (category !== (task.category || "")) updateData.category = category;
    if (difficulty !== (task.levelOfDifficulty || "")) updateData.levelOfDifficulty = difficulty;
    if (link !== (task.link || "")) updateData.link = link;
    if (instructions !== (task.instructions || "")) updateData.instructions = instructions;
    if (feedback !== (task.feedback || "")) updateData.feedback = feedback;
    if (paymentTerms !== (task.paymentTerms || "")) updateData.paymentTerms = paymentTerms;
    if (targetCountry !== (task.targetCountry || "")) updateData.targetCountry = targetCountry;
    if (targetNumberOfParticipants !== (task.targetNumberOfParticipants || 0)) 
      updateData.targetNumberOfParticipants = targetNumberOfParticipants;
    if (rewardAmountPerParticipant !== (task.rewardAmountPerParticipant || 0)) 
      updateData.rewardAmountPerParticipant = rewardAmountPerParticipant;
    if (rewardCurrencyId !== (task.rewardCurrencyId || 0)) 
      updateData.rewardCurrencyId = rewardCurrencyId;
    if (estimatedTimeOfCompletionInMinutes !== (task.estimatedTimeOfCompletionInMinutes || 0)) 
      updateData.estimatedTimeOfCompletionInMinutes = estimatedTimeOfCompletionInMinutes;
    if (numberOfCooldownHours !== (task.numberOfCooldownHours || 0)) 
      updateData.numberOfCooldownHours = numberOfCooldownHours;
    if (isAvailable !== (task.isAvailable || false)) 
      updateData.isAvailable = isAvailable;
    if (isTest !== (task.isTest || false)) 
      updateData.isTest = isTest;
    if (managerContractAddress !== (task.managerContractAddress || "")) 
      updateData.managerContractAddress = managerContractAddress;
    
    // Super admin can reassign task to different task master
    if (isSuperAdmin && assignToTaskMaster && assignedTaskMasterEmailAddress) {
      if (assignedTaskMasterEmailAddress !== (task.rezTaskMasterEmailAddress || "")) {
        updateData.rezTaskMasterEmailAddress = assignedTaskMasterEmailAddress;
      }
    }

    if (Object.keys(updateData).length === 0) {
      toast.info("No changes detected");
      onOpenChange(false);
      return;
    }

    const success = await updateTask(task.id, updateData);

    if (success) {
      adminTaskEditComplete({
        task_id: task.id,
        changed_fields: Object.keys(updateData),
      });
      onOpenChange(false);
      onSuccess?.();
    } else {
      adminTaskEditFailed({
        task_id: task.id,
        error_message: "Failed to update task",
      });
      toast.error("Failed to update task");
    }
  };

  const handleCancel = () => {
    if (task?.id) {
      adminTaskEditCancelled({ task_id: task.id });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task (Admin)</DialogTitle>
          <DialogDescription>
            Full access to all task fields. Task ID: {task?.id}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-6 py-4">
            {/* Task Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Task Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {taskTypes.map((taskType) => (
                  <Card
                    key={taskType.value}
                    className={`p-3 cursor-pointer border-2 transition-all ${
                      type === taskType.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setType(taskType.value)}
                  >
                    <div className="font-medium text-sm mb-1">{taskType.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {taskType.description}
                    </div>
                  </Card>
                ))}
                {/* Video Interview - Coming Soon */}
                <Card className="p-3 border-2 border-border bg-muted/50 opacity-60 cursor-not-allowed relative">
                  <Badge className="absolute top-2 right-2 bg-orange-500 hover:bg-orange-500">
                    Coming Soon
                  </Badge>
                  <div className="font-medium text-sm mb-1 text-muted-foreground">Video Interview</div>
                  <div className="text-xs text-muted-foreground">
                    Users participate in video interviews for qualitative research
                  </div>
                </Card>
              </div>
              {task?.type === "doVideoInterview" && (
                <Badge variant="secondary" className="mt-2">
                  Video Interview (view only)
                </Badge>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
              />
            </div>

            {/* Category & Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-difficulty">Level of Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((diff) => (
                      <SelectItem key={diff} value={diff}>
                        {diff}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target Country */}
            <div className="space-y-2">
              <Label htmlFor="edit-target-country">Target Country</Label>
              <Input
                id="edit-target-country"
                value={targetCountry}
                onChange={(e) => setTargetCountry(e.target.value)}
                placeholder="e.g., ALL, US, KE, NG (comma-separated)"
              />
              <p className="text-xs text-muted-foreground">
                Use &quot;ALL&quot; for all countries or comma-separated country codes
              </p>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6 py-4">
            {/* Link */}
            <div className="space-y-2">
              <Label htmlFor="edit-link">Task Link / URL</Label>
              <Input
                id="edit-link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label htmlFor="edit-instructions">Instructions</Label>
              <Textarea
                id="edit-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Step-by-step instructions for completing the task..."
                rows={4}
              />
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <Label htmlFor="edit-feedback">Feedback Form URL</Label>
              <Input
                id="edit-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Link to feedback form"
              />
            </div>

            {/* Payment Terms */}
            <div className="space-y-2">
              <Label htmlFor="edit-payment-terms">Payment Terms</Label>
              <Textarea
                id="edit-payment-terms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Terms and conditions for payment..."
                rows={3}
              />
            </div>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6 py-4">
            {/* Target Number of Participants */}
            <div className="space-y-2">
              <Label htmlFor="edit-target-participants">Target Number of Participants</Label>
              <Input
                id="edit-target-participants"
                type="number"
                min={0}
                value={targetNumberOfParticipants}
                onChange={(e) => setTargetNumberOfParticipants(Number(e.target.value))}
              />
            </div>

            {/* Reward Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-reward-amount">Reward Amount per Participant</Label>
                <Input
                  id="edit-reward-amount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={rewardAmountPerParticipant}
                  onChange={(e) => setRewardAmountPerParticipant(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-reward-currency">Reward Currency</Label>
                <Select 
                  value={rewardCurrencyId.toString()} 
                  onValueChange={(value) => setRewardCurrencyId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency">
                      {rewardCurrencyId > 0 && supportedTokens[rewardCurrencyId] && (
                        <div className="flex items-center gap-2">
                          <Image
                            src={supportedTokens[rewardCurrencyId].imagePath}
                            alt={supportedTokens[rewardCurrencyId].name}
                            width={16}
                            height={16}
                            className="rounded-full"
                          />
                          <span>{supportedTokens[rewardCurrencyId].symbol} - {supportedTokens[rewardCurrencyId].name}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(supportedTokens).map((token) => (
                      <SelectItem key={token.id} value={token.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Image
                            src={token.imagePath}
                            alt={token.name}
                            width={16}
                            height={16}
                            className="rounded-full"
                          />
                          <span>{token.symbol} - {token.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Manager Contract Address */}
            <div className="space-y-2">
              <Label htmlFor="edit-contract-address">Manager Contract Address</Label>
              <Input
                id="edit-contract-address"
                value={managerContractAddress}
                onChange={(e) => setManagerContractAddress(e.target.value)}
                placeholder="0x..."
              />
              <p className="text-xs text-muted-foreground">
                Smart contract address for reward distribution
              </p>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 py-4">
            {/* Estimated Time */}
            <div className="space-y-2">
              <Label htmlFor="edit-estimated-time">Estimated Time (minutes)</Label>
              <Input
                id="edit-estimated-time"
                type="number"
                min={0}
                value={estimatedTimeOfCompletionInMinutes}
                onChange={(e) => setEstimatedTimeOfCompletionInMinutes(Number(e.target.value))}
              />
            </div>

            {/* Cooldown Hours */}
            <div className="space-y-2">
              <Label htmlFor="edit-cooldown">Cooldown Period (hours)</Label>
              <Input
                id="edit-cooldown"
                type="number"
                min={0}
                value={numberOfCooldownHours}
                onChange={(e) => setNumberOfCooldownHours(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Hours to wait before a user can participate again (0 = no cooldown)
              </p>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label htmlFor="edit-available" className="font-medium">Task Available</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this task visible and available for participation
                  </p>
                </div>
                <Switch
                  id="edit-available"
                  checked={isAvailable}
                  onCheckedChange={setIsAvailable}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label htmlFor="edit-test" className="font-medium">Test Task</Label>
                  <p className="text-sm text-muted-foreground">
                    Mark as test task (may not provide real rewards)
                  </p>
                </div>
                <Switch
                  id="edit-test"
                  checked={isTest}
                  onCheckedChange={setIsTest}
                />
              </div>
            </div>

            {/* Task Master Assignment (Super Admin only) */}
            {isSuperAdmin && (
              <div className="space-y-4 p-4 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Assign to Task Master</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reassign this task to a different task master
                    </p>
                  </div>
                  <Switch
                    checked={assignToTaskMaster}
                    onCheckedChange={(checked) => {
                      setAssignToTaskMaster(checked);
                      if (!checked) {
                        setAssignedTaskMasterEmailAddress(task?.rezTaskMasterEmailAddress || "");
                      }
                    }}
                  />
                </div>
                {assignToTaskMaster && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-assigned-task-master-select">Select Task Master</Label>
                    {taskMasters.length > 0 ? (
                      <Select
                        value={assignedTaskMasterEmailAddress}
                        onValueChange={setAssignedTaskMasterEmailAddress}
                      >
                        <SelectTrigger id="edit-assigned-task-master-select">
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
                    {task && (
                      <p className="text-xs text-muted-foreground">
                        Current: {task.rezTaskMasterEmailAddress || "Not assigned"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

