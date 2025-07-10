import { useNewTaskStore } from '@/stores/new-task-store';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function Step5Review() {
  const { data } = useNewTaskStore();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-2">Review Task Details</h2>
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-4">
          <div>
            <Label>Category:</Label> <span>{data.category || '-'}</span>
          </div>
          <div>
            <Label>Title:</Label> <span>{data.title || '-'}</span>
          </div>
          <div>
            <Label>Description:</Label> <span>{data.description || '-'}</span>
          </div>
          <div>
            <Label>Objective:</Label> <span>{data.objective || '-'}</span>
          </div>
          {/*
          <div>
            <Label>Countries:</Label> <span>{data.countries?.join(', ') || '-'}</span>
          </div>
          <div>
            <Label>Gender:</Label> <span>{data.gender || '-'}</span>
          </div>
          <div>
            <Label>Age Range:</Label> <span>{data.minAge ?? 18} to {data.maxAge ?? 100}</span>
          </div>
          */}
        </div>
        <div className="mb-2">
          <Label>Tally Form URL:</Label> <span>{data.tallyFormUrl || '-'}</span>
        </div>
      </Card>
      <div className="text-center text-muted-foreground">(TODO: Add final submit action here)</div>
    </div>
  );
}
