"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function AdminAccessDenied() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto p-3 rounded-full bg-destructive/10 w-fit mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to access the admin dashboard.
            This area is restricted to super administrators only.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
