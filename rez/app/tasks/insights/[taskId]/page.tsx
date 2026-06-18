import { redirect } from "next/navigation";

export default async function LegacyPollInsightsPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  redirect(`/insights/${taskId}`);
}
