import { useNewTaskStore } from "@/stores/new-task-store";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function Step5Review() {
  const { data } = useNewTaskStore();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-2">Review Task Details</h2>
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-4">
          <div>
            <Label>Type:</Label>{" "}
            <span className="font-bold">{data.type || "-"}</span>
          </div>
          <div>
            <Label>Title:</Label>{" "}
            <span className="font-bold">{data.title || "-"}</span>
          </div>
          <div>
            <Label>Category:</Label>{" "}
            <span className="font-bold">{data.category || "-"}</span>
          </div>
          <div>
            <Label>Difficulty:</Label>{" "}
            <span className="font-bold">{data.difficulty || "-"}</span>
          </div>

          <div>
            <Label>Tally Form URL:</Label>{" "}
            <span>{data.tallyFormUrl || "-"}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
