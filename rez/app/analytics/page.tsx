import TaskCompletionsOverTime from '@/components/analytics/TaskCompletionsOverTime';
import TimeOfTaskCompletions from '@/components/analytics/TimeOfTaskCompletions';
import GenderDistribution from '@/components/analytics/GenderDistribution';
import CountryDistribution from '@/components/analytics/CountryDistribution';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen pb-20 sm:p-4 font-[family-name:var(--font-sen)] p-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-1">Analytics Overview</h1>
      <p className="text-muted-foreground mb-6">Summary of task completions and participant demographics.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TaskCompletionsOverTime />
        <TimeOfTaskCompletions />
        <GenderDistribution />
        <CountryDistribution />
      </div>
    </div>
  );
}
  