"use client";

import { Suspense } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import AdminEditTaskPageContent from "./AdminEditTaskPageContent";

export default function AdminEditTaskPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground">Loading task...</p>
        </div>
      }
    >
      <AdminEditTaskPageContent />
    </Suspense>
  );
}
