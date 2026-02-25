"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { useAdminStore, AdminParticipant } from "@/stores/admin-store";
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
  ArrowPathIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  UserMinusIcon,
  UserPlusIcon,
  EllipsisVerticalIcon,
  ClipboardDocumentIcon,
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
import Link from "next/link";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";
import ParticipantDetailPanel from "@/components/admin/ParticipantDetailPanel";
import { AlgoliaAttribution } from "@/components/algolia-attribution";

export default function AdminParticipantsPage() {
  const router = useRouter();
  const { user } = useTaskMasterStore();
  const {
    participants,
    isLoadingParticipants,
    isLoadingMoreParticipants,
    hasMoreParticipants,
    fetchAllParticipants,
    loadMoreParticipants,
    isTogglingParticipantStatus,
    toggleParticipantStatus,
    error,
  } = useAdminStore();

  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [participantToToggle, setParticipantToToggle] = useState<AdminParticipant | null>(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [participantPanelOpen, setParticipantPanelOpen] = useState(false);
  const didInitialFetch = useRef(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && user) {
      if (user.isSuperAdmin) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } else if (isHydrated && !user) {
      router.push("/sign-in");
    }
  }, [isHydrated, user, router]);

  useEffect(() => {
    if (!isAuthorized) return;
    if (didInitialFetch.current) return;
    didInitialFetch.current = true;
    fetchAllParticipants(true, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only once when authorized
  }, [isAuthorized]);

  const runSearch = useCallback(async () => {
    await fetchAllParticipants(true, searchInput.trim() || "");
  }, [fetchAllParticipants, searchInput]);

  const handleRefresh = useCallback(async () => {
    try {
      await fetchAllParticipants(true, searchInput.trim() || "");
      toast.success("Participants refreshed!");
    } catch {
      toast.error("Failed to refresh participants");
    }
  }, [fetchAllParticipants, searchInput]);

  const handleToggleStatusClick = (participant: AdminParticipant) => {
    setParticipantToToggle(participant);
    setDisableDialogOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!participantToToggle?.id) return;

    const newDisabledStatus = !participantToToggle.disabled;
    const success = await toggleParticipantStatus(participantToToggle.id, newDisabledStatus);

    if (success) {
      setDisableDialogOpen(false);
      setParticipantToToggle(null);
      toast.success(`Participant ${newDisabledStatus ? "disabled" : "enabled"} successfully`);
      await fetchAllParticipants(true, searchInput.trim() || "");
    } else {
      toast.error("Failed to update participant status");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text || text === "—" || text === "N/A") return;
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Failed to copy")
    );
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

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-sm">Back to Admin Dashboard</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheckIcon className="h-6 w-6 text-primary" />
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  Participants
                </h1>
              </div>
              <p className="text-muted-foreground">
                View and disable/enable participant accounts in Pax ({participants.length} shown
                {hasMoreParticipants ? ", load more for more" : ""})
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isLoadingParticipants}
              variant="outline"
              size="sm"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoadingParticipants ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex gap-2 max-w-md items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              className="pl-10 h-9"
            />
          </div>
          <Button
            type="button"
            onClick={() => runSearch()}
            disabled={isLoadingParticipants}
            variant="outline"
            size="sm"
            className="h-9 shrink-0"
          >
            {isLoadingParticipants ? (
              <MagnifyingGlassIcon className="h-4 w-4 animate-pulse" />
            ) : (
              "Search"
            )}
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">Error: {error}</p>
          </div>
        )}

        {isLoadingParticipants && (
          <div className="flex flex-col items-center justify-center py-16">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Loading participants...</p>
          </div>
        )}

        {!isLoadingParticipants && participants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-3 rounded-full bg-muted mb-3">
              <XCircleIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">
              {searchInput.trim() ? "No participants match your search" : "No participants found"}
            </p>
          </div>
        )}

        {!isLoadingParticipants && participants.length > 0 && (
          <div className="bg-white rounded-lg border border-border/50 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[50px] font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Participant ID</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Display name</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant, index) => (
                  <TableRow key={participant.id} className="hover:bg-muted/20">
                    <TableCell className="text-muted-foreground text-center">{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm align-middle">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(participant.id, "Participant ID")}
                        className="group/copy inline-flex items-center gap-2 rounded px-1.5 -mx-1.5 py-1 hover:bg-muted/80 transition-colors text-left w-full disabled:pointer-events-none disabled:opacity-100"
                        title={participant.id ? "Copy participant ID" : undefined}
                        disabled={!participant.id}
                      >
                        <span className="truncate min-w-0 flex-1">{participant.id || "N/A"}</span>
                        {participant.id && (
                          <ClipboardDocumentIcon className="h-4 w-4 shrink-0 text-muted-foreground opacity-50 group-hover/copy:opacity-100" aria-hidden />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground align-middle">
                      {participant.emailAddress ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedParticipantId(participant.id);
                            setParticipantPanelOpen(true);
                          }}
                          className="inline-flex rounded px-1.5 -mx-1.5 py-1 hover:bg-muted/80 transition-colors text-left w-full cursor-pointer"
                          title="View participant details"
                        >
                          <span className="truncate min-w-0 flex-1">{participant.emailAddress}</span>
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="truncate max-w-[200px] block" title={participant.displayName || ""}>
                        {participant.displayName || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {participant.disabled ? (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100/80 border-0">
                          <UserMinusIcon className="h-3 w-3 mr-1" />
                          Disabled
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80 border-0">
                          <UserPlusIcon className="h-3 w-3 mr-1" />
                          Enabled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            disabled={!!isTogglingParticipantStatus}
                          >
                            {isTogglingParticipantStatus && participantToToggle?.id === participant.id ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <EllipsisVerticalIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleToggleStatusClick(participant)}
                            className="cursor-pointer"
                          >
                            {participant.disabled ? (
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {hasMoreParticipants && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMoreParticipants()}
              disabled={isLoadingMoreParticipants}
            >
              {isLoadingMoreParticipants ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}

        <AlgoliaAttribution />

        <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {participantToToggle?.disabled ? "Enable Participant" : "Disable Participant"}
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to {participantToToggle?.disabled ? "enable" : "disable"}{" "}
                &quot;{participantToToggle?.displayName || participantToToggle?.emailAddress || participantToToggle?.id || "this participant"}&quot;?
                {!participantToToggle?.disabled && (
                  <span className="block mt-2 text-destructive">
                    This will prevent them from signing in to the Pax app.
                  </span>
                )}
                {participantToToggle?.disabled && (
                  <span className="block mt-2 text-[#5C29A3]">
                    This will allow them to sign in to the Pax app again.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDisableDialogOpen(false);
                  setParticipantToToggle(null);
                }}
                disabled={isTogglingParticipantStatus}
              >
                Cancel
              </Button>
              <Button
                variant={participantToToggle?.disabled ? "default" : "destructive"}
                onClick={handleConfirmToggleStatus}
                disabled={isTogglingParticipantStatus}
              >
                {isTogglingParticipantStatus ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    {participantToToggle?.disabled ? "Enabling..." : "Disabling..."}
                  </>
                ) : participantToToggle?.disabled ? (
                  "Enable"
                ) : (
                  "Disable"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ParticipantDetailPanel
          participantId={selectedParticipantId}
          open={participantPanelOpen}
          onOpenChange={setParticipantPanelOpen}
          onUpdate={() => fetchAllParticipants(true, searchInput.trim() || "")}
        />
      </div>
    </div>
  );
}
