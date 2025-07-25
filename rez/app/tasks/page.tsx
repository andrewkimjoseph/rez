"use client";

import { useNewTaskStore, TaskStep } from "@/stores/new-task-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Step1TaskType from "@/components/new-task/Step1TaskType";
import Step2TaskDetails from "@/components/new-task/Step2TaskDetails";
import Step4QuestionsTasks from "@/components/new-task/Step3QuestionsTasks";
import Step5Review from "@/components/new-task/Step4Review";
import { toast, Toaster } from "sonner";
import NewTask from "@/components/new-task/tab-component/NewTask";

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

export default function Tasks() {
  const { step, nextStep, prevStep, setStep } = useNewTaskStore();

  const handleContinue = () => {
    if (step === 4) {
      toast("Task created!", {
        description: "Your new task has been created successfully.",
      });
    } else {
      nextStep();
    }
  };

  return (
    <div className="min-h-screen pb-20 sm:p-4 font-[family-name:var(--font-sen)] p-4">
      <Toaster />
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-1">Create New Task</h1>
        <p className="text-muted-foreground mb-6">
          Create a new task using our step-by-step wizard or let AI help you
          build it faster.
        </p>
        <Tabs defaultValue="create" className="w-full mb-6">
          <TabsList className="bg-white">
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-[#363062] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-[#363062] px-6 py-2"
            >
              Create New Task
            </TabsTrigger>

            <TabsTrigger
              value="view-tasks"
              className="data-[state=active]:bg-[#363062] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-[#363062] px-6 py-2"
            >
              View Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <NewTask />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
