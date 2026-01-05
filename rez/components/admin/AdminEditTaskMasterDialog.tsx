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
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskMaster } from "@/firebase/firestore/models/TaskMaster";
import { useAdminStore, AdminUpdateTaskMasterData } from "@/stores/admin-store";
import { Loader2, Crown } from "lucide-react";
import { toast } from "sonner";

interface AdminEditTaskMasterDialogProps {
  taskMaster: TaskMaster | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AdminEditTaskMasterDialog({ 
  taskMaster, 
  open, 
  onOpenChange,
  onSuccess 
}: AdminEditTaskMasterDialogProps) {
  const { updateTaskMaster, isUpdating } = useAdminStore();
  
  const [name, setName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Initialize form with task master data when it changes
  useEffect(() => {
    if (taskMaster) {
      setName(taskMaster.name || "");
      setEmailAddress(taskMaster.emailAddress || "");
      setOrganizationId(taskMaster.organizationId || "");
      setIsSuperAdmin((taskMaster as TaskMaster & { isSuperAdmin?: boolean }).isSuperAdmin || false);
    }
  }, [taskMaster]);

  const handleSubmit = async () => {
    if (!taskMaster?.id) return;

    const updateData: AdminUpdateTaskMasterData = {};
    
    // Only include changed fields
    if (name !== (taskMaster.name || "")) updateData.name = name;
    if (emailAddress !== (taskMaster.emailAddress || "")) updateData.emailAddress = emailAddress;
    if (organizationId !== (taskMaster.organizationId || "")) updateData.organizationId = organizationId;
    if (isSuperAdmin !== ((taskMaster as TaskMaster & { isSuperAdmin?: boolean }).isSuperAdmin || false)) 
      updateData.isSuperAdmin = isSuperAdmin;

    if (Object.keys(updateData).length === 0) {
      toast.info("No changes detected");
      onOpenChange(false);
      return;
    }

    const success = await updateTaskMaster(taskMaster.id, updateData);
    
    if (success) {
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error("Failed to update task master");
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Task Master (Admin)</DialogTitle>
          <DialogDescription>
            Manage task master profile and permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Preview */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
            <Avatar className="h-14 w-14">
              <AvatarImage src={taskMaster?.profilePictureURI || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {getInitials(taskMaster?.name || null)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{taskMaster?.name || 'Unnamed User'}</p>
              <p className="text-sm text-muted-foreground">{taskMaster?.emailAddress || 'No email'}</p>
              <p className="text-xs text-muted-foreground mt-1">ID: {taskMaster?.id}</p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email Address</Label>
            <Input
              id="edit-email"
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          {/* Organization ID */}
          <div className="space-y-2">
            <Label htmlFor="edit-org">Organization ID</Label>
            <Input
              id="edit-org"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              placeholder="Organization identifier"
            />
          </div>

          {/* Super Admin Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <Crown className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <Label htmlFor="edit-admin" className="font-medium text-amber-700">
                  Super Admin Access
                </Label>
                <p className="text-sm text-muted-foreground">
                  Grant full administrative privileges to this user
                </p>
              </div>
            </div>
            <Switch
              id="edit-admin"
              checked={isSuperAdmin}
              onCheckedChange={setIsSuperAdmin}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? (
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

