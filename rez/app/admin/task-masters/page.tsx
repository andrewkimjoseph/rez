"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { useAdminStore } from "@/stores/admin-store";
import { TaskMaster } from "@/firebase/firestore/models/TaskMaster";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheckIcon,
  PencilIcon,
  ArrowPathIcon,
  XCircleIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  UserIcon,
  UserMinusIcon,
  UserPlusIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { toast } from "sonner";
import AdminEditTaskMasterDialog from "@/components/admin/AdminEditTaskMasterDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";
import { AlgoliaAttribution } from "@/components/algolia-attribution";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";

export default function AdminTaskMastersPage() {
  const router = useRouter();
  const { user } = useTaskMasterStore();
  const {
    taskMasters,
    isLoadingTaskMasters,
    isLoadingMoreTaskMasters,
    hasMoreTaskMasters,
    fetchAllTaskMasters,
    loadMoreTaskMasters,
    isTogglingStatus,
    toggleTaskMasterStatus,
    error
  } = useAdminStore();
  const {
    adminTaskMastersPageViewed,
    adminTaskMasterEditClicked,
    adminTaskMasterDisableClicked,
    adminTaskMasterDisableComplete,
    adminTaskMasterDisableFailed,
    adminTaskMasterEnableClicked,
    adminTaskMasterEnableComplete,
    adminTaskMasterEnableFailed,
    adminTaskMastersRefreshClicked,
    adminTaskMastersSearchPerformed,
  } = useAmplitudeEvents();
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskMasterToEdit, setTaskMasterToEdit] = useState<TaskMaster | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [taskMasterToToggle, setTaskMasterToToggle] = useState<(TaskMaster & { disabled?: boolean }) | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && user) {
      if (user.isSuperAdmin) {
        setIsAuthorized(true);
        fetchAllTaskMasters();
      } else {
        setIsAuthorized(false);
      }
    } else if (isHydrated && !user) {
      router.push("/sign-in");
    }
  }, [isHydrated, user, router, fetchAllTaskMasters]);

  // Track page view when authorized
  const hasTrackedPageView = useRef(false);
  useEffect(() => {
    if (isAuthorized && !isLoadingTaskMasters && !hasTrackedPageView.current) {
      adminTaskMastersPageViewed({ total_task_masters: taskMasters.length });
      hasTrackedPageView.current = true;
    }
  }, [isAuthorized, isLoadingTaskMasters, taskMasters.length, adminTaskMastersPageViewed]);

  // Track search with debouncing
  useEffect(() => {
    if (searchQuery.length > 0) {
      const timeoutId = setTimeout(() => {
        adminTaskMastersSearchPerformed({ search_query: searchQuery });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, adminTaskMastersSearchPerformed]);

  const handleRefresh = async () => {
    adminTaskMastersRefreshClicked();
    try {
      await fetchAllTaskMasters(true);
      toast.success("Task masters refreshed!");
    } catch {
      toast.error("Failed to refresh task masters");
    }
  };

  const handleEditClick = (taskMaster: TaskMaster) => {
    adminTaskMasterEditClicked({
      task_master_id: taskMaster.id,
      task_master_email: taskMaster.emailAddress,
    });
    setTaskMasterToEdit(taskMaster);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    toast.success("Task master updated successfully");
  };

  const handleToggleStatusClick = (taskMaster: TaskMaster & { disabled?: boolean; isSuperAdmin?: boolean }) => {
    // Prevent toggling for super admins
    if (taskMaster.isSuperAdmin) {
      toast.error("Cannot disable a super admin");
      return;
    }
    if (taskMaster.disabled) {
      adminTaskMasterEnableClicked({
        task_master_id: taskMaster.id,
        task_master_name: taskMaster.name,
      });
    } else {
      adminTaskMasterDisableClicked({
        task_master_id: taskMaster.id,
        task_master_name: taskMaster.name,
      });
    }
    setTaskMasterToToggle(taskMaster);
    setDisableDialogOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!taskMasterToToggle?.id) return;

    const newDisabledStatus = !taskMasterToToggle.disabled;
    const success = await toggleTaskMasterStatus(taskMasterToToggle.id, newDisabledStatus);

    if (success) {
      if (newDisabledStatus) {
        adminTaskMasterDisableComplete({ task_master_id: taskMasterToToggle.id });
      } else {
        adminTaskMasterEnableComplete({ task_master_id: taskMasterToToggle.id });
      }
      setDisableDialogOpen(false);
      setTaskMasterToToggle(null);
      toast.success(`Task master ${newDisabledStatus ? 'disabled' : 'enabled'} successfully`);
      // Force refresh to get updated status
      await fetchAllTaskMasters(true);
    } else {
      if (newDisabledStatus) {
        adminTaskMasterDisableFailed({
          task_master_id: taskMasterToToggle.id,
          error_message: "Failed to disable task master",
        });
      } else {
        adminTaskMasterEnableFailed({
          task_master_id: taskMasterToToggle.id,
          error_message: "Failed to enable task master",
        });
      }
      toast.error('Failed to update task master status');
    }
  };

  const handleCancelToggleStatus = () => {
    setDisableDialogOpen(false);
    setTaskMasterToToggle(null);
  };

  const formatTimestamp = (timestamp: unknown) => {
    if (!timestamp) return 'N/A';
    try {
      const ts = timestamp as { seconds?: number; _seconds?: number };
      const seconds = ts.seconds || ts._seconds;
      if (seconds) {
        return new Date(seconds * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        });
      }
      return 'N/A';
    } catch {
      return 'N/A';
    }
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

  // Filter task masters based on search query
  const filteredTaskMasters = taskMasters.filter(tm => {
    const query = searchQuery.toLowerCase();
    return (
      (tm.name?.toLowerCase().includes(query)) ||
      (tm.id?.toLowerCase().includes(query)) ||
      (tm.emailAddress?.toLowerCase().includes(query)) ||
      (tm.organizationId?.toLowerCase().includes(query))
    );
  });

  // Sort by creation date (newest first)
  const sortedTaskMasters = [...filteredTaskMasters].sort((a, b) => {
    const getTime = (ts: unknown) => {
      const timestamp = ts as { seconds?: number; _seconds?: number };
      return (timestamp?.seconds || timestamp?._seconds || 0) * 1000;
    };
    return getTime(b.timeCreated) - getTime(a.timeCreated);
  });

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

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-sm">Back to Admin Dashboard</span>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheckIcon className="h-6 w-6 text-primary" />
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  All Task Masters
                </h1>
              </div>
              <p className="text-muted-foreground">
                View and manage all task masters in the system ({taskMasters.length} total)
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isLoadingTaskMasters}
              variant="outline"
              size="sm"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoadingTaskMasters ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2 items-center flex-wrap max-w-md">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, ID, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <AlgoliaAttribution />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">Error: {error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoadingTaskMasters && (
          <div className="flex flex-col items-center justify-center py-16">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Loading task masters...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingTaskMasters && sortedTaskMasters.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-3 rounded-full bg-muted mb-3">
              <XCircleIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">
              {searchQuery ? "No task masters match your search" : "No task masters found"}
            </p>
          </div>
        )}

        {/* Task Masters Table */}
        {!isLoadingTaskMasters && sortedTaskMasters.length > 0 && (
          <div className="bg-white rounded-lg border border-border/50 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[50px] font-semibold">#</TableHead>
                  <TableHead className="font-semibold min-w-[200px]">User</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Organization ID</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="w-[120px] font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTaskMasters.map((taskMaster, index) => (
                  <TableRow key={taskMaster.id} className="hover:bg-muted/20">
                    <TableCell className="text-muted-foreground text-center">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={taskMaster.profilePictureURI || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(taskMaster.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {taskMaster.name || 'Unnamed User'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]" title={taskMaster.id}>
                            {taskMaster.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm truncate max-w-[200px]" title={taskMaster.emailAddress || ''}>
                        {taskMaster.emailAddress || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground truncate max-w-[150px]" title={taskMaster.organizationId || ''}>
                        {taskMaster.organizationId || 'None'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {(taskMaster as TaskMaster & { isSuperAdmin?: boolean }).isSuperAdmin ? (
                          <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 border-0 w-fit">
                            <ShieldCheckIcon className="h-3 w-3 mr-1" />
                            Super Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="w-fit">
                            <UserIcon className="h-3 w-3 mr-1" />
                            Task Master
                          </Badge>
                        )}
                        {(taskMaster as TaskMaster & { disabled?: boolean }).disabled && (
                          <Badge variant="destructive" className="w-fit text-xs">
                            <UserMinusIcon className="h-3 w-3 mr-1" />
                            Disabled
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTimestamp(taskMaster.timeCreated)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditClick(taskMaster)}
                            className="cursor-pointer"
                          >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {!(taskMaster as TaskMaster & { isSuperAdmin?: boolean }).isSuperAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleToggleStatusClick(taskMaster as TaskMaster & { disabled?: boolean; isSuperAdmin?: boolean })}
                                className="cursor-pointer"
                              >
                                {(taskMaster as TaskMaster & { disabled?: boolean }).disabled ? (
                                  <>
                                    <UserPlusIcon className="h-4 w-4 mr-2" />
                                    Enable
                                  </>
                                ) : (
                                  <>
                                    <UserMinusIcon className="h-4 w-4 mr-2" />
                                    Disable
                                  </>
                                )}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground text-center">
            Showing {sortedTaskMasters.length} task master{sortedTaskMasters.length !== 1 ? 's' : ''}
            {hasMoreTaskMasters && ' (more available)'}
          </p>
          {hasMoreTaskMasters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMoreTaskMasters()}
              disabled={isLoadingMoreTaskMasters}
            >
              {isLoadingMoreTaskMasters ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load more'
              )}
            </Button>
          )}
        </div>

        {/* Edit Task Master Dialog */}
        <AdminEditTaskMasterDialog
          taskMaster={taskMasterToEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleEditSuccess}
        />

        {/* Disable/Enable Confirmation Dialog */}
        <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {taskMasterToToggle?.disabled ? 'Enable Task Master' : 'Disable Task Master'}
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to {taskMasterToToggle?.disabled ? 'enable' : 'disable'} &quot;{taskMasterToToggle?.name || taskMasterToToggle?.emailAddress || 'this task master'}&quot;?
                {!taskMasterToToggle?.disabled && (
                  <span className="block mt-2 text-destructive">
                    This will prevent them from signing in to the platform.
                  </span>
                )}
                {taskMasterToToggle?.disabled && (
                  <span className="block mt-2 text-[#5C29A3]">
                    This will allow them to sign in to the platform again.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancelToggleStatus}
                disabled={isTogglingStatus}
              >
                Cancel
              </Button>
              <Button
                variant={taskMasterToToggle?.disabled ? "default" : "destructive"}
                onClick={handleConfirmToggleStatus}
                disabled={isTogglingStatus}
              >
                {isTogglingStatus ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    {taskMasterToToggle?.disabled ? 'Enabling...' : 'Disabling...'}
                  </>
                ) : taskMasterToToggle?.disabled ? 'Enable' : 'Disable'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

