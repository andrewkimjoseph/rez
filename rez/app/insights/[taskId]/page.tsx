import PollInsightsPanel from "@/components/poll-insights/PollInsightsPanel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default async function PollInsightDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link href="/insights">
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
            All insights
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
          Poll insights
        </h1>
        <p className="text-muted-foreground mt-1">
          Full results and demographic breakdown
        </p>
      </div>
      <PollInsightsPanel taskId={taskId} />
    </div>
  );
}
