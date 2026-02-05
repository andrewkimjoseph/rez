"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HomeIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 md:p-8">
      <Card className="w-full max-w-md border-border/50 shadow-sm bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2 pb-2">
          <p className="text-6xl font-bold tracking-tight text-primary tabular-nums">
            404
          </p>
          <CardTitle className="text-xl font-semibold text-foreground">
            Page not found
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            The page you’re looking for doesn’t exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            variant="default"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            asChild
          >
            <Link href="/dashboard">
              <HomeIcon className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
          <Button
            variant="outline"
            className="border-border hover:bg-accent hover:text-accent-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Go back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
