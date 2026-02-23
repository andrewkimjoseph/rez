"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowPathIcon,
  UserMinusIcon,
  UserPlusIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { fetchWithAuthRetry } from "@/lib/api-fetch";

interface ParticipantDetailPanelProps {
  participantId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

interface ParticipantData {
  id: string;
  emailAddress: string | null;
  displayName: string | null;
  country: string | null;
  accountType: string | null;
  disabled: boolean;
  timeCreated: any | null;
  timeUpdated: any | null;
  verifiedWalletAddresses?: string[];
}

export default function ParticipantDetailPanel({
  participantId,
  open,
  onOpenChange,
  onUpdate,
}: ParticipantDetailPanelProps) {
  const [participant, setParticipant] = useState<ParticipantData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingDisabledStatus, setPendingDisabledStatus] = useState<boolean | null>(null);

  const fetchParticipant = useCallback(async () => {
    if (!participantId) return;

    setIsLoading(true);
    try {
      const res = await fetchWithAuthRetry(
        `/api/admin/participants/${encodeURIComponent(participantId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setParticipant(data);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to fetch participant");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error fetching participant:", error);
      toast.error("Failed to fetch participant");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }, [participantId, onOpenChange]);

  // Fetch participant data when panel opens
  useEffect(() => {
    if (open && participantId) {
      fetchParticipant();
    } else {
      // Reset state when panel closes
      setParticipant(null);
      setDisabled(false);
    }
  }, [open, participantId, fetchParticipant]);

  // Update disabled state when participant data loads
  useEffect(() => {
    if (participant) {
      setDisabled(participant.disabled);
    }
  }, [participant]);

  const handleToggleStatusClick = (checked: boolean) => {
    // checked = true means enabled, so disabled = false
    // checked = false means disabled, so disabled = true
    const newDisabledStatus = !checked;
    setPendingDisabledStatus(newDisabledStatus);
    setConfirmDialogOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!participantId || !participant || pendingDisabledStatus === null) return;

    setIsSaving(true);
    
    try {
      const res = await fetchWithAuthRetry("/api/admin/toggleParticipantStatus", {
        method: "PATCH",
        body: JSON.stringify({
          participantId,
          disabled: pendingDisabledStatus,
        }),
      });

      if (res.ok) {
        toast.success(`Participant ${pendingDisabledStatus ? "disabled" : "enabled"} successfully`);
        setConfirmDialogOpen(false);
        setPendingDisabledStatus(null);
        setDisabled(pendingDisabledStatus);
        await fetchParticipant(); // Refresh data
        onUpdate?.(); // Notify parent to refresh completions list
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to update participant status");
      }
    } catch (error) {
      console.error("Error updating participant status:", error);
      toast.error("Failed to update participant status");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelToggleStatus = () => {
    setConfirmDialogOpen(false);
    setPendingDisabledStatus(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text || text === "—" || text === "N/A") return;
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Failed to copy")
    );
  };

  const formatTimestamp = (timestamp: unknown) => {
    if (!timestamp) return "N/A";
    try {
      const ts = timestamp as { seconds?: number; _seconds?: number };
      const seconds = ts.seconds ?? ts._seconds;
      if (seconds != null) {
        return new Date(seconds * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return "N/A";
    } catch {
      return "N/A";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Participant Details</SheetTitle>
          <SheetDescription>
            View participant information and manage account status
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Loading participant...</p>
          </div>
        ) : participant ? (
          <div className="space-y-6 py-6 px-6">
            {/* Participant ID */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Participant ID
              </Label>
              <button
                type="button"
                onClick={() => copyToClipboard(participant.id, "Participant ID")}
                className="group/copy inline-flex items-center gap-2 rounded px-1.5 -mx-1.5 py-1 hover:bg-muted/80 transition-colors text-left w-full"
              >
                <span className="font-mono text-sm break-all">{participant.id}</span>
                <ClipboardDocumentIcon className="h-4 w-4 shrink-0 text-muted-foreground opacity-50 group-hover/copy:opacity-100" aria-hidden />
              </button>
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <Label>Email Address</Label>
              {participant.emailAddress ? (
                <button
                  type="button"
                  onClick={() => copyToClipboard(participant.emailAddress || "", "Email")}
                  className="group/copy inline-flex items-center gap-2 rounded px-1.5 -mx-1.5 py-1 hover:bg-muted/80 transition-colors text-left w-full"
                >
                  <span className="text-sm break-all">{participant.emailAddress}</span>
                  <ClipboardDocumentIcon className="h-4 w-4 shrink-0 text-muted-foreground opacity-50 group-hover/copy:opacity-100" aria-hidden />
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label>Country</Label>
              <p className="text-sm">{participant.country || "—"}</p>
            </div>

            {/* Account Type */}
            <div className="space-y-2">
              <Label>Account Type</Label>
              <p className="text-sm">{participant.accountType || "—"}</p>
            </div>

            {/* Verified Wallet Address(es) */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Verified Wallet
              </Label>
              {participant.verifiedWalletAddresses?.length ? (
                <ul className="space-y-1.5 text-xs">
                  {participant.verifiedWalletAddresses.map((addr) => (
                    <li key={addr} className="flex items-center gap-2">
                      <a
                        href={`https://celoscan.io/address/${addr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all font-mono text-xs flex-1 min-w-0"
                      >
                        {addr}
                      </a>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          copyToClipboard(addr, "Wallet address");
                        }}
                        className="shrink-0 rounded p-1 hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
                        title="Copy address"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-red-600 font-medium">NONE</p>
              )}
            </div>

            {/* Disabled Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Status
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow participant to sign in
                  </p>
                </div>
                <Switch
                  checked={!disabled}
                  onCheckedChange={handleToggleStatusClick}
                  disabled={isSaving || isLoading}
                />
              </div>
              <div>
                {disabled ? (
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
              </div>
            </div>

            {/* Created Date */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Created
              </Label>
              <p className="text-sm">{formatTimestamp(participant.timeCreated)}</p>
            </div>

            {/* Updated Date */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Last Updated
              </Label>
              <p className="text-sm">{formatTimestamp(participant.timeUpdated)}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">No participant data available</p>
          </div>
        )}

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving || isLoading}
            className="w-full"
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>

      <Dialog open={confirmDialogOpen} onOpenChange={(open) => {
        if (!open) {
          handleCancelToggleStatus();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingDisabledStatus ? "Disable Participant" : "Enable Participant"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {pendingDisabledStatus ? "disable" : "enable"}{" "}
              &quot;{participant?.displayName || participant?.emailAddress || participant?.id || "this participant"}&quot;?
              {pendingDisabledStatus && (
                <span className="block mt-2 text-destructive">
                  This will prevent them from signing in to the Pax app.
                </span>
              )}
              {pendingDisabledStatus === false && (
                <span className="block mt-2 text-[#5C29A3]">
                  This will allow them to sign in to the Pax app again.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelToggleStatus}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant={pendingDisabledStatus ? "destructive" : "default"}
              onClick={handleConfirmToggleStatus}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  {pendingDisabledStatus ? "Disabling..." : "Enabling..."}
                </>
              ) : pendingDisabledStatus ? (
                "Disable"
              ) : (
                "Enable"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
