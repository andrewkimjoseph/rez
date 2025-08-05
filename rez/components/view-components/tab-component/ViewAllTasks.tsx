import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useTasksData } from "@/hooks/use-tasks-data";
import { Badge } from "@/components/ui/badge";

export default function ViewTasks() {
  const { tasks, taskCompletions, isLoading, error } = useTasksData({ autoFetch: false });

  // Calculate task completions for each task
  const getTaskCompletionsCount = (taskId: string | null) => {
    if (!taskId) return 0;
    return taskCompletions.filter(completion => completion.taskId === taskId).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-500">No tasks found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      
      <Table>
        <TableCaption>A list of all your tasks.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead className="text-right">Completions</TableHead>
            <TableHead className="text-right">Time (min)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">
                <div className="max-w-[200px] truncate" title={task.title || ''}>
                  {task.title || 'Untitled Task'}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {task.type || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {task.category || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={task.isAvailable ? "default" : "destructive"}
                  className="text-xs"
                >
                  {task.isAvailable ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    task.levelOfDifficulty === 'Easy' ? 'text-green-600' :
                    task.levelOfDifficulty === 'Medium' ? 'text-yellow-600' :
                    task.levelOfDifficulty === 'Hard' ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  {task.levelOfDifficulty || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {getTaskCompletionsCount(task.id)}
              </TableCell>
              <TableCell className="text-right">
                {task.estimatedTimeOfCompletionInMinutes || 0}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 