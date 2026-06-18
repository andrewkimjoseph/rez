import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNewTaskStore, TaskStep } from "@/stores/new-task-store";
import Step1TaskType from "@/components/new-task/Step1TaskType";
import Step2TaskDetails from "@/components/new-task/Step2TaskDetails";
import Step3Cost from "@/components/new-task/Step3Cost";
import Step4QuestionsTasks from "@/components/new-task/Step3QuestionsTasks";
import Step5Review from "@/components/new-task/Step4Review";
import { toast } from "sonner";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { useTasksStore } from "@/stores/tasks-store";
import type { Task } from "@/firebase/firestore/models/Task";
import { useState } from "react";
import {
  ArrowPathIcon,
  ClockIcon,
  ExclamationCircleIcon,
  QuestionMarkCircleIcon,
  CheckIcon,
  Squares2X2Icon,
  DocumentTextIcon,
  LinkIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";
import Link from "next/link";
import { validatePollQuestions } from "@/types/poll";

const stepConfig = [
  { title: "Type", description: "Choose task type", icon: Squares2X2Icon },
  { title: "Details", description: "Add information", icon: DocumentTextIcon },
  { title: "Cost", description: "Set pricing", icon: CurrencyDollarIcon },
  { title: "Links", description: "Add resources", icon: LinkIcon },
  { title: "Review", description: "Confirm & create", icon: ClipboardDocumentCheckIcon },
];

function Stepper({ step }: { step: TaskStep }) {
  const totalSteps = 5;
  // Calculate progress: 0 segments at step 1, 4 segments at step 5
  const completedSegments = step - 1;

  return (
    <div className="mb-4">
      {/* Steps with connecting lines */}
      <div className="relative mb-4">
        {/* Connecting lines between steps - positioned to align with circle centers */}
        <div className="absolute top-5 inset-x-0 flex px-[calc(10%+4px)]">
          {[0, 1, 2, 3].map((segmentIndex) => (
            <div
              key={segmentIndex}
              className={`h-0.5 flex-1 transition-colors duration-300 ${
                segmentIndex < completedSegments ? 'bg-[#5C29A3]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {stepConfig.map((stepItem, idx) => {
            const stepNumber = idx + 1;
            const isCurrent = stepNumber === step;
            const isCompleted = stepNumber < step;
            const IconComponent = stepItem.icon;

            return (
              <div
                key={stepItem.title}
                className="flex flex-col items-center"
              >
                {/* Step circle */}
                <div
                  className={`relative z-10 rounded-full w-10 h-10 flex items-center justify-center font-semibold border-2 transition-all duration-300 ${
                    isCurrent
                      ? "bg-[#5C29A3] text-white border-[#5C29A3] shadow-lg shadow-[#5C29A3]/30 scale-110"
                      : isCompleted
                      ? "bg-[#5C29A3] text-white border-[#5C29A3]"
                      : "bg-white text-gray-400 border-gray-200"
                  }`}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <IconComponent className="w-5 h-5" />
                  )}
                </div>

                {/* Step label */}
                <div className="mt-2 text-center">
                  <div className={`text-sm font-medium transition-colors duration-300 ${
                    isCurrent
                      ? "text-[#5C29A3]"
                      : isCompleted
                      ? "text-gray-700"
                      : "text-gray-400"
                  }`}>
                    {stepItem.title}
                  </div>
                  <div className={`text-xs mt-0.5 transition-colors duration-300 hidden sm:block ${
                    isCurrent
                      ? "text-[#5C29A3]/70"
                      : "text-gray-400"
                  }`}>
                    {stepItem.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current step indicator */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-1.5 rounded-full">
          <span className="font-medium text-[#5C29A3]">Step {step}</span>
          <span>of {totalSteps}</span>
          <span className="text-gray-300">|</span>
          <span>{stepConfig[step - 1]?.description}</span>
        </span>
      </div>
    </div>
  );
}

function TaskStepContent({ step }: { step: TaskStep }) {
  switch (step) {
    case 1:
      return <Step1TaskType />;
    case 2:
      return <Step2TaskDetails />;
    case 3:
      return <Step3Cost />;
    case 4:
      return <Step4QuestionsTasks />;
    case 5:
      return <Step5Review />;
    default:
      return null;
  }
}

export default function NewTask() {
  const { step, nextStep, prevStep, data, reset, editMode, editingTaskId, editingTaskReasons } = useNewTaskStore();
  const { user } = useTaskMasterStore();
  const { tasks, fetchTasksForList, prependTask } = useTasksStore();
  const [isCreating, setIsCreating] = useState(false);
  const {
    createNewTaskClicked,
    createNewTaskComplete,
    createNewTaskFailed,
    taskCreationStep1Completed,
    taskCreationStep2Completed,
    taskCreationStep3Completed,
    taskCreationStepBackClicked,
  } = useAmplitudeEvents();
  // Check if user can create a new task (once per week limit)
  // Super admins are exempt from rate limiting
  const getTaskCreationStatus = () => {
    // Super admins can always create tasks
    if (user?.isSuperAdmin === true) {
      return { canCreate: true, lastTaskDate: null, daysLeft: 0 };
    }

    if (!user?.emailAddress || !tasks.length) {
      return { canCreate: true, lastTaskDate: null, daysLeft: 0 };
    }

    // Find the user's most recent task
    const userTasks = tasks.filter(
      (task) => task.rezTaskMasterEmailAddress === user.emailAddress
    );

    if (userTasks.length === 0) {
      return { canCreate: true, lastTaskDate: null, daysLeft: 0 };
    }

    // Sort by most recent activity (creation or update) and get the most recent
    const sortedTasks = userTasks.sort((a, b) => {
      const getTimestamp = (timestamp: any) => {
        if (timestamp?._seconds) return timestamp._seconds * 1000;
        if (timestamp?.seconds) return timestamp.seconds * 1000;
        if (timestamp?.toDate) return timestamp.toDate().getTime();
        return 0;
      };
      
      // Get the most recent timestamp for each task (created or updated)
      const getMostRecentTime = (task: typeof a) => {
        const created = getTimestamp(task.timeCreated);
        const updated = getTimestamp(task.timeUpdated);
        return Math.max(created, updated);
      };
      
      return getMostRecentTime(b) - getMostRecentTime(a);
    });

    const latestTask = sortedTasks[0];

    // Calculate time since last task activity (creation or update)
    const getTimestamp = (timestamp: any) => {
      if (timestamp?._seconds) return timestamp._seconds * 1000;
      if (timestamp?.seconds) return timestamp.seconds * 1000;
      if (timestamp?.toDate) return timestamp.toDate().getTime();
      return 0;
    };
    
    const createdTime = getTimestamp(latestTask.timeCreated);
    const updatedTime = getTimestamp(latestTask.timeUpdated);
    const lastTaskTime = Math.max(createdTime, updatedTime);

    if (lastTaskTime === 0) {
      return { canCreate: true, lastTaskDate: null, daysLeft: 0 };
    }

    const oneWeekMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const timeSinceLastTask = Date.now() - lastTaskTime;
    const canCreate = timeSinceLastTask >= oneWeekMs;
    const daysLeft = canCreate
      ? 0
      : Math.ceil((oneWeekMs - timeSinceLastTask) / (24 * 60 * 60 * 1000));

    return {
      canCreate,
      lastTaskDate: new Date(lastTaskTime),
      daysLeft,
      lastTaskTitle: latestTask.title,
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
        // Step 3: Cost - requires questions/feedback questions and participants/testers at minimums
        if (data.type === 'fillAForm') {
          return !!(data.numberOfQuestions && data.numberOfQuestions >= 5 &&
                   data.targetNumberOfParticipants && data.targetNumberOfParticipants >= 50);
        } else if (data.type === 'checkOutApp') {
          return !!(data.numberOfFeedbackQuestions && data.numberOfFeedbackQuestions >= 3 &&
                   data.targetNumberOfParticipants && data.targetNumberOfParticipants >= 10);
        } else if (data.type === 'answerPoll') {
          return !!(data.targetNumberOfParticipants && data.targetNumberOfParticipants >= 50);
        }
        return false;
      case 4:
        if (data.type === 'answerPoll') {
          return validatePollQuestions(data.pollQuestions) === null;
        }
        // Step 4: Links - requires link, and for checkOutApp also requires instructions and feedback
        if (data.type === 'checkOutApp') {
          return !!(data.link && data.instructions && data.feedback);
        }
        return !!data.link;
      case 5:
        if (data.type === 'answerPoll') {
          return !!(
            data.type &&
            data.title &&
            data.category &&
            data.difficulty &&
            data.targetNumberOfParticipants &&
            data.targetNumberOfParticipants >= 50 &&
            validatePollQuestions(data.pollQuestions) === null
          );
        }
        // Step 5: Review - all required fields should be filled
        const baseFieldsValid = !!(
          data.type &&
          data.title &&
          data.category &&
          data.difficulty &&
          data.targetNumberOfParticipants &&
          data.link
        );
        const costFieldsValid = data.type === 'fillAForm'
          ? !!(data.numberOfQuestions && data.numberOfQuestions >= 5 && data.targetNumberOfParticipants && data.targetNumberOfParticipants >= 50)
          : !!(data.numberOfFeedbackQuestions && data.numberOfFeedbackQuestions >= 3 && data.targetNumberOfParticipants && data.targetNumberOfParticipants >= 10);
        if (data.type === 'checkOutApp') {
          return baseFieldsValid && costFieldsValid && !!(data.instructions && data.feedback);
        }
        return baseFieldsValid && costFieldsValid;
      default:
        return false;
    }
  };

  const handleContinue = async () => {
    if (step === 5) {
      setIsCreating(true);
      
      if (editMode) {
        createNewTaskClicked(); // Track as edit
      } else {
        createNewTaskClicked();
      }
      
      try {
        if (editMode && editingTaskId) {
          // Update existing task
          const response = await fetch("/api/updateTask", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              taskId: editingTaskId,
              data: {
                type: data.type!,
                title: data.title!,
                category: data.category || "Other",
                difficulty: data.difficulty || "Medium",
                link: data.link,
                instructions: data.instructions,
                feedback: data.feedback,
                targetNumberOfParticipants: data.targetNumberOfParticipants,
                numberOfQuestions: data.numberOfQuestions,
                numberOfFeedbackQuestions: data.numberOfFeedbackQuestions,
                pollQuestions: data.pollQuestions,
                ...(editingTaskReasons?.length
                  ? {
                      reviewStatus: "pending" as const,
                      reasonsForRejection: [],
                    }
                  : {}),
              },
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update task");
          }

          toast("Task updated!", {
            description: "Your task has been updated and submitted for review.",
          });
          createNewTaskComplete({
            task_id: editingTaskId,
            task_title: data.title,
            task_type: data.type,
            task_category: data.category,
            task_difficulty: data.difficulty,
            task_link: data.link,
          });
          // Stop loading and reset the form immediately after the toast
          setIsCreating(false);
          reset();
          void fetchTasksForList(true);
        } else {
          // Create new task
          // Get the last task creation timestamp to send to API (avoids DB reads)
          let lastTaskCreatedAt: number | null = null;
          if (taskCreationStatus.lastTaskDate) {
            lastTaskCreatedAt = taskCreationStatus.lastTaskDate.getTime();
          }

          // Create the task via API route
          const response = await fetch("/api/createTask", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: data.type!,
              title: data.title!,
              category: data.category || "Other",
              difficulty: data.difficulty || "Medium",
              gender: data.gender,
              link: data.link,
              instructions: data.instructions,
              feedback: data.feedback,
              targetNumberOfParticipants: data.targetNumberOfParticipants,
              numberOfQuestions: data.numberOfQuestions,
              numberOfFeedbackQuestions: data.numberOfFeedbackQuestions,
              pollQuestions: data.pollQuestions,
              lastTaskCreatedAt, // Send timestamp to avoid server DB reads
              isSuperAdmin: user?.isSuperAdmin === true, // Send super admin status to avoid server DB reads
              // Super admin can assign to different task master
              assignedTaskMasterEmailAddress: user?.isSuperAdmin && data.assignToTaskMaster
                ? data.assignedTaskMasterEmailAddress
                : undefined,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to create task");
          }

          const result = await response.json();

          const createdTask: Task = {
            id: result.taskId,
            taskMasterId: null,
            title: data.title ?? null,
            type: data.type ?? null,
            category: data.category ?? "Other",
            estimatedTimeOfCompletionInMinutes: null,
            deadline: null,
            targetNumberOfParticipants: data.targetNumberOfParticipants ?? null,
            numberOfQuestions: data.numberOfQuestions ?? null,
            numberOfFeedbackQuestions: data.numberOfFeedbackQuestions ?? null,
            link: data.link ?? null,
            levelOfDifficulty: data.difficulty ?? "Medium",
            managerContractAddress: null,
            rewardAmountPerParticipant: null,
            rewardCurrencyId: null,
            isAvailable: false,
            reviewStatus: "pending",
            timeCreated: { seconds: Math.floor(Date.now() / 1000) } as Task["timeCreated"],
            timeUpdated: null,
            isTest: null,
            feedback: data.feedback ?? null,
            paymentTerms: null,
            instructions: data.instructions ?? null,
            targetCountry: null,
            numberOfCooldownHours: null,
            rezTaskMasterEmailAddress: user?.emailAddress ?? null,
          };
          prependTask(createdTask);

          toast("Task created!", {
            description: `Your new task has been created successfully with ID: ${result.taskId}`,
          });
          createNewTaskComplete({
            task_id: result.taskId,
            task_title: data.title,
            task_type: data.type,
            task_category: data.category,
            task_difficulty: data.difficulty,
            task_link: data.link,
          });
          // Stop loading and reset the form immediately after the toast
          setIsCreating(false);
          reset();
          void fetchTasksForList(true);
        }
      } catch (error) {
        toast(editMode ? "Error updating task" : "Error creating task", {
          description:
            editMode
              ? "There was an error updating your task. Please try again."
              : "There was an error creating your task. Please try again.",
        });
        createNewTaskFailed({
          error_message: error?.toString(),
        });
      } finally {
        setIsCreating(false);
      }
    } else {
      // Track step completions
      if (step === 1) {
        taskCreationStep1Completed({ task_type: data.type });
      } else if (step === 2) {
        taskCreationStep2Completed({
          task_title: data.title,
          task_category: data.category,
          task_difficulty: data.difficulty,
        });
      } else if (step === 4) {
        taskCreationStep3Completed({
          has_instructions: !!data.instructions,
          has_feedback: !!data.feedback,
        });
      }
      nextStep();
    }
  };

  const handleBack = () => {
    taskCreationStepBackClicked({ from_step: step });
    prevStep();
  };

  // Rate limiting banner component
  const RateLimitBanner = () => (
    <Card className="p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <ClockIcon className="w-6 h-6 text-orange-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Task Creation Limit Reached
          </h3>
          <p className="text-gray-600 mb-4">
            You can only create one task per week. You created your last task{" "}
            <span className="font-medium">
              &ldquo;{taskCreationStatus.lastTaskTitle}&rdquo;
            </span>{" "}
            on{" "}
            <span className="font-medium">
              {taskCreationStatus.lastTaskDate?.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            .
          </p>
          <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded-lg">
            <ExclamationCircleIcon className="w-5 h-5 text-orange-600" />
            <span className="text-orange-800 font-medium">
              You can create your next task in{" "}
              <span className="font-bold">
                {taskCreationStatus.daysLeft} day
                {taskCreationStatus.daysLeft !== 1 ? "s" : ""}
              </span>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );

  // Show rate limit banner if user cannot create a task (skip for edit mode)
  if (!editMode && !taskCreationStatus.canCreate) {
    return <RateLimitBanner />;
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Link href="/about#how-to-create-a-task">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            <QuestionMarkCircleIcon className="h-3.5 w-3.5 mr-1.5" />
            Need help? Learn how to create a task
          </Button>
        </Link>
      </div>
      <Card className="p-6">
        <Stepper step={step} />
        <TaskStepContent step={step} />
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || isCreating}
          >
            Back
          </Button>
          <Button onClick={handleContinue} disabled={isCreating || !canProceed()}>
            {step === 5 ? (
              isCreating ? (
                <>
                  <ArrowPathIcon className="animate-spin" />
                  {editMode ? "Updating Task..." : "Creating Task..."}
                </>
              ) : (
                editMode ? "Update Task" : "Finish"
              )
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </Card>
    </>
  );
}
