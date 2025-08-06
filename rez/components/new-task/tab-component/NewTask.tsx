import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNewTaskStore, TaskStep } from "@/stores/new-task-store";
import Step1TaskType from "@/components/new-task/Step1TaskType";
import Step2TaskDetails from "@/components/new-task/Step2TaskDetails";
import Step3Targeting from "@/components/new-task/Step3Targeting";
import Step4QuestionsTasks from "@/components/new-task/Step3QuestionsTasks";
import Step5Review from "@/components/new-task/Step4Review";
import { toast } from "sonner";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { useTasksStore } from "@/stores/tasks-store";
import { useState } from "react";
import { Loader2, Loader2Icon, Clock, AlertCircle } from "lucide-react";

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
  const { step, nextStep, prevStep, data, reset } = useNewTaskStore();
  const { user } = useTaskMasterStore();
  const { tasks, fetchTasksAndCompletions } = useTasksStore();
  const [isCreating, setIsCreating] = useState(false);

  // Check if user can create a new task (once per week limit)
  const getTaskCreationStatus = () => {
    if (!user?.emailAddress || !tasks.length) {
      return { canCreate: true, lastTaskDate: null, daysLeft: 0 };
    }

    // Find the user's most recent task
    const userTasks = tasks.filter(task => 
      task.rezTaskMasterEmailAddress === user.emailAddress
    );

    if (userTasks.length === 0) {
      return { canCreate: true, lastTaskDate: null, daysLeft: 0 };
    }

    // Sort by creation time and get the most recent
    const sortedTasks = userTasks.sort((a, b) => {
      const getTimestamp = (timestamp: any) => {
        if (timestamp?._seconds) return timestamp._seconds * 1000;
        if (timestamp?.seconds) return timestamp.seconds * 1000;
        if (timestamp?.toDate) return timestamp.toDate().getTime();
        return 0;
      };
      return getTimestamp(b.timeCreated) - getTimestamp(a.timeCreated);
    });

    const latestTask = sortedTasks[0];
    
    if (!latestTask.timeCreated) {
      return { canCreate: true, lastTaskDate: null, daysLeft: 0 };
    }

    // Calculate time since last task
    let lastTaskTime: number;
    const timestamp = latestTask.timeCreated as any;
    if (timestamp._seconds) {
      lastTaskTime = timestamp._seconds * 1000;
    } else if (timestamp.seconds) {
      lastTaskTime = timestamp.seconds * 1000;
    } else if (timestamp.toDate) {
      lastTaskTime = timestamp.toDate().getTime();
    } else {
      return { canCreate: true, lastTaskDate: null, daysLeft: 0 };
    }

    const oneWeekMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const timeSinceLastTask = Date.now() - lastTaskTime;
    const canCreate = timeSinceLastTask >= oneWeekMs;
    const daysLeft = canCreate ? 0 : Math.ceil((oneWeekMs - timeSinceLastTask) / (24 * 60 * 60 * 1000));
    
    return {
      canCreate,
      lastTaskDate: new Date(lastTaskTime),
      daysLeft,
      lastTaskTitle: latestTask.title
    };
  };

  const taskCreationStatus = getTaskCreationStatus();

  // Validation function to check if current step can proceed
  const canProceed = () => {
    switch (step) {
      case 1:
        // Step 1: Task Type - requires type selection
        return !!data.type;
      case 2:
        // Step 2: Task Details - requires title, category, and difficulty
        return !!(data.title && data.category && data.difficulty);
      case 3:
        // Step 3: Questions & Tasks - requires tally form URL
        return !!data.tallyFormUrl;
      case 4:
        // Step 4: Review - all required fields should be filled
        return !!(data.type && data.title && data.category && data.difficulty && data.tallyFormUrl);
      default:
        return false;
    }
  };

  const handleContinue = async () => {
    if (step === 4) {
      setIsCreating(true);
      try {
        // Create the task via API route
        const response = await fetch('/api/createTask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: data.type!,
            title: data.title!,
            category: data.category || "Other",
            difficulty: data.difficulty || "Medium",
            countries: data.countries,
            gender: data.gender,
            tallyFormUrl: data.tallyFormUrl,  
            rezTaskMasterEmailAddress: user?.emailAddress,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create task');
        }

        const result = await response.json();
        
        toast("Task created!", {
          description: `Your new task has been created successfully with ID: ${result.taskId}`,
        });
        
        // Refresh the tasks list to include the newly created task
        await fetchTasksAndCompletions();
        
        // Reset the form after successful creation
        reset();
      } catch (error) {
        console.error('Error creating task:', error);
        toast("Error creating task", {
          description: "There was an error creating your task. Please try again.",
        });
      } finally {
        setIsCreating(false);
      }
    } else {
      nextStep();
    }
  };

  // Rate limiting banner component
  const RateLimitBanner = () => (
    <Card className="p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Task Creation Limit Reached
          </h3>
          <p className="text-gray-600 mb-4">
            You can only create one task per week. You created your last task{' '}
            <span className="font-medium">"{taskCreationStatus.lastTaskTitle}"</span>{' '}
            on{' '}
            <span className="font-medium">
              {taskCreationStatus.lastTaskDate?.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>.
          </p>
          <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="text-orange-800 font-medium">
              You can create your next task in{' '}
              <span className="font-bold">{taskCreationStatus.daysLeft} day{taskCreationStatus.daysLeft !== 1 ? 's' : ''}</span>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );

  // Show rate limit banner if user cannot create a task
  if (!taskCreationStatus.canCreate) {
    return <RateLimitBanner />;
  }

  return (
    <Card className="p-6">
      <Stepper step={step} />
      <TaskStepContent step={step} />
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={prevStep} disabled={step === 1 || isCreating}>
          Back
        </Button>
        <Button 
          onClick={handleContinue} 
          disabled={isCreating || !canProceed()}
        >
          {step === 4 ? (
            isCreating ? (
              <>
                <Loader2Icon className="animate-spin" />
                Creating Task...
              </>
            ) : (
              "Finish"
            )
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </Card>
  );
} 