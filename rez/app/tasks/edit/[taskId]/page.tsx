"use client";

import { Suspense } from "react";
import EditTaskPageContent from "./EditTaskPageContent";

export default function EditTaskPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6">
          <p className="text-muted-foreground">Loading task...</p>
        </div>
      }
    >
      <EditTaskPageContent />
    </Suspense>
  );
}
