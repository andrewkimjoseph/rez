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
import { Task } from "@/firebase/firestore/models/Task";
import { useTasksStore, EditTaskData } from "@/stores/tasks-store";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const taskTypes = [
  { value: "fillAForm", label: "Fill a Form", description: "Users fill out forms or surveys" },
  { value: "checkOutApp", label: "Check Out App", description: "Users test and explore applications" },
];

const categories = ["Finance", "Climate", "Education", "Health", "Technology", "Other"];
const difficulties = ["Easy", "Medium", "Hard"];

export default function EditTaskDialog({ 
  task, 
  open, 
  onOpenChange,
  onSuccess 
}: EditTaskDialogProps) {
  const { editTask, isEditing } = useTasksStore();
  
  // Form state
  const [type, setType] = useState<string>("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [link, setLink] = useState("");
  const [instructions, setInstructions] = useState("");
  const [feedback, setFeedback] = useState("");

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
    }
  }, [task]);

  const handleSubmit = async () => {
    if (!task?.id) return;

    const updateData: EditTaskData = {};
    
    // Only include changed fields
    if (type !== task.type) updateData.type = type as EditTaskData["type"];
    if (title !== (task.title || "")) updateData.title = title;
    if (category !== (task.category || "")) updateData.category = category;
    if (difficulty !== (task.levelOfDifficulty || "")) updateData.levelOfDifficulty = difficulty;
    if (link !== (task.link || "")) updateData.link = link;
    if (instructions !== (task.instructions || "")) updateData.instructions = instructions;
    if (feedback !== (task.feedback || "")) updateData.feedback = feedback;

    if (Object.keys(updateData).length === 0) {
      toast.info("No changes detected");
      onOpenChange(false);
      return;
    }

    const success = await editTask(task.id, updateData);
    
    if (success) {
      toast.success("Task updated successfully");
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error("Failed to update task");
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getLinkLabel = () => {
    if (type === "fillAForm") return "Link to form";
    if (type === "checkOutApp") return "Link to product";
    return "Link";
  };

  const getLinkPlaceholder = () => {
    if (type === "fillAForm") return "Paste your form URL here";
    if (type === "checkOutApp") return "Paste your product/app URL here";
    return "Paste the URL here";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Make changes to your task. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Task Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Task Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              placeholder="e.g. Recycling Habits & Digital Rewards"
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

          {/* Link */}
          <div className="space-y-2">
            <Label htmlFor="edit-link">{getLinkLabel()}</Label>
            <Input
              id="edit-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder={getLinkPlaceholder()}
            />
          </div>

          {/* Instructions (for checkOutApp) */}
          {type === "checkOutApp" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-instructions">Instructions</Label>
                <Textarea
                  id="edit-instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Enter instructions for users on how to complete this task..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Provide clear instructions on what users need to do with the product/app.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-feedback">Link to feedback form</Label>
                <Input
                  id="edit-feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Paste the feedback form URL here"
                />
                <p className="text-xs text-muted-foreground">
                  Users will submit their feedback through this form after completing the task.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isEditing}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isEditing}>
            {isEditing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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

