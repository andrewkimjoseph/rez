"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  BanknotesIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";
import AdminAccessDenied from "@/components/admin/AdminAccessDenied";
import { fetchWithAuthRetry } from "@/lib/api-fetch";

const SEARCH_DEBOUNCE_MS = 400;
const LIMIT = 50;

type WithdrawalMethod = {
  id: string;
  participantId: string | null;
  participantEmail: string | null;
  walletAddress: string | null;
};

export default function AdminWithdrawalMethodsPage() {
  const router = useRouter();
  const { user } = useTaskMasterStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [methods, setMethods] = useState<WithdrawalMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<{ startAfterDocId: string } | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const searchEffectSkippedInitial = useRef(false);

  const loadPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      const term = searchInput.trim();
      const url = cursor
        ? `/api/admin/withdrawalMethods?limit=${LIMIT}&startAfterDocId=${encodeURIComponent(cursor)}${term ? `&search=${encodeURIComponent(term)}` : ""}`
        : `/api/admin/withdrawalMethods?limit=${LIMIT}${term ? `&search=${encodeURIComponent(term)}` : ""}`;
      const res = await fetchWithAuthRetry(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      const list = data.withdrawalMethods ?? [];
      setMethods((prev) => (append ? [...prev, ...list] : list));
      setHasMore(data.hasMore === true);
      setNextCursor(data.nextCursor?.startAfterDocId ? { startAfterDocId: data.nextCursor.startAfterDocId } : null);
    },
    [searchInput]
  );

  const fetchInitial = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadPage(null, false);
    } catch {
      toast.error("Failed to load withdrawal methods");
      setMethods([]);
      setHasMore(false);
      setNextCursor(null);
    } finally {
      setIsLoading(false);
    }
  }, [loadPage]);

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
    if (!searchEffectSkippedInitial.current) {
      searchEffectSkippedInitial.current = true;
      fetchInitial();
      return;
    }
    const t = setTimeout(() => fetchInitial(), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [isAuthorized, searchInput, fetchInitial]);

  const loadMore = async () => {
    if (!nextCursor?.startAfterDocId || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      await loadPage(nextCursor.startAfterDocId, true);
    } catch {
      toast.error("Failed to load more");
    } finally {
      setIsLoadingMore(false);
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
                <BanknotesIcon className="h-6 w-6 text-primary" />
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  Withdrawal Methods
                </h1>
              </div>
              <p className="text-muted-foreground">
                View all payment/withdrawal methods ({methods.length} shown
                {hasMore ? ", load more for more" : ""})
              </p>
            </div>
            <Button onClick={fetchInitial} disabled={isLoading} variant="outline" size="sm">
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by participant email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Loading withdrawal methods...</p>
          </div>
        )}

        {!isLoading && methods.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-3 rounded-full bg-muted mb-3">
              <XCircleIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">
              {searchInput.trim() ? "No methods match your search" : "No withdrawal methods found"}
            </p>
          </div>
        )}

        {!isLoading && methods.length > 0 && (
          <div className="bg-white rounded-lg border border-border/50 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold w-12">#</TableHead>
                  <TableHead className="font-semibold">Participant email</TableHead>
                  <TableHead className="font-semibold">Participant ID</TableHead>
                  <TableHead className="font-semibold">Wallet address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map((m, index) => (
                  <TableRow key={m.id} className="hover:bg-muted/20">
                    <TableCell className="text-sm text-muted-foreground w-12">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.participantEmail ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {m.participantId ? (
                        <span className="truncate max-w-[180px] inline-block" title={m.participantId}>
                          {m.participantId}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {m.walletAddress ? (
                        <a
                          href={`https://celoscan.io/address/${m.walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all font-mono text-xs"
                        >
                          {m.walletAddress}
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {hasMore && (
              <div className="flex justify-center py-4 border-t border-border/50">
                <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoadingMore}>
                  {isLoadingMore ? (
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
          </div>
        )}
      </div>
    </div>
  );
}
