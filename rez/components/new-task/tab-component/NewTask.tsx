import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNewTaskStore, TaskStep } from "@/stores/new-task-store";
import Step1TaskType from "@/components/new-task/Step1TaskType";
import Step2TaskDetails from "@/components/new-task/Step2TaskDetails";
import Step3Targeting from "@/components/new-task/Step3Targeting";
import Step4QuestionsTasks from "@/components/new-task/Step3QuestionsTasks";
import Step5Review from "@/components/new-task/Step4Review";
import { toast } from "sonner";

const stepTitles = [
  "Task Type",
  "Task Details",
  // "Targeting", // commented out
  "Questions & Tasks",
  "Review",
];

function Stepper({ step }: { step: TaskStep }) {
  // Only show 4 steps in the stepper
  return (
    <div className="flex items-center justify-between mb-6">
      {[0, 1, 2, 3].map((idx) => {
        const current = idx + 1 === step;
        const completed = idx + 1 < step;
        return (
          <div
            key={stepTitles[idx]}
            className="flex flex-col items-center flex-1"
          >
            <div
              className={`rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 ${
                current
                  ? "bg-[#363062] text-white border-[#363062]"
                  : completed
                  ? "bg-[#ececec] text-[#363062] border-[#363062]"
                  : "bg-white text-[#363062] border-[#ececec]"
              }`}
            >
              {idx + 1}
            </div>
            <span className="text-xs mt-2 text-center whitespace-nowrap">
              {stepTitles[idx]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TaskStepContent({ step }: { step: TaskStep }) {
  switch (step) {
    case 1:
      return <Step1TaskType />;
    case 2:
      return <Step2TaskDetails />;
    // case 3:
    //   return <Step3Targeting />;
    case 3:
      return <Step4QuestionsTasks />;
    case 4:
      return <Step5Review />;
    default:
      return null;
  }
}

export default function NewTask() {
  const { step, nextStep, prevStep } = useNewTaskStore();

  const handleContinue = () => {
    if (step === 4) {
      toast("Task created!", {
        description: "Your new task has been created successfully.",
      });
      // Do not advance step, just show toast
    } else {
      nextStep();
    }
  };

  return (
    <Card className="p-6">
      <Stepper step={step} />
      <TaskStepContent step={step} />
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={prevStep} disabled={step === 1}>
          Back
        </Button>
        <Button onClick={handleContinue}>
          {step === 4 ? "Finish" : "Continue"}
        </Button>
      </div>
    </Card>
  );
} 