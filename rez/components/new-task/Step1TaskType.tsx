import { useNewTaskStore } from '@/stores/new-task-store';
import { Card } from '@/components/ui/card';

export default function Step1TaskType() {
  const { data: { type }, updateData } = useNewTaskStore();

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Select Task Type</h2>
      <div className="flex gap-4">
        <Card
        
          className={`flex-1 p-4 cursor-pointer border-2 ${type === 'survey' ? 'border-[#363062]' : 'border-gray-200'}`}
          onClick={() => updateData({ type: 'survey' })}
        >
          <div className="font-bold mb-1">Survey</div>
          <div className="text-sm text-muted-foreground mb-2">Collect quantitative and qualitative feedback through questionnaires</div>
          {/* <div className="text-xs">Suggested payout: <span className="font-semibold">$1.50</span></div>
          <div className="text-xs">Platform fee: <span className="font-semibold">15%</span></div> */}
        </Card>
        <Card
          className={`flex-1 p-4 cursor-pointer border-2 ${type === 'non-survey' ? 'border-[#363062]' : 'border-gray-200'}`}
          onClick={() => updateData({ type: 'non-survey' })}
        >
          <div className="font-bold mb-1">Non-Survey</div>
          <div className="text-sm text-muted-foreground mb-2">Assign a custom research or user testing activity to gather targeted insights</div>

        </Card>
      </div>
    </div>
  );
} 