import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { requireAuth } from '@/lib/api-auth';

/**
 * Fetches all tasks and their completions for the authenticated Rez task master.
 *
 * This combines the logic of:
 * - /api/fetchAllTasksForRezTaskMaster
 * - /api/fetchAllTaskCompletionsForRezTaskMaster
 *
 * so that task documents are only read once from Firestore.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (!authResult.email) {
      return NextResponse.json(
        { error: 'User email not found in authentication token' },
        { status: 400 }
      );
    }

    // Get all tasks for the authenticated user's email
    const tasksRef = paxDB.collection('tasks');
    const tasksSnapshot = await tasksRef
      .where('rezTaskMasterEmailAddress', '==', authResult.email)
      .get();

    const tasks: any[] = [];
    const taskIds: string[] = [];

    tasksSnapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data(),
      });
      taskIds.push(doc.id);
    });

    if (taskIds.length === 0) {
      return NextResponse.json({ tasks, taskCompletions: [] });
    }

    // Then, get all task completions where taskId matches any of the task IDs
    // Firestore 'in' operator supports up to 30 values, so we need to batch the queries
    const taskCompletionsRef = paxDB.collection('task_completions');
    const taskCompletions: any[] = [];

    const chunkSize = 30;
    for (let i = 0; i < taskIds.length; i += chunkSize) {
      const chunk = taskIds.slice(i, i + chunkSize);
      const taskCompletionsSnapshot = await taskCompletionsRef
        .where('taskId', 'in', chunk)
        .get();

      taskCompletionsSnapshot.forEach((doc) => {
        taskCompletions.push({
          id: doc.id,
          ...doc.data(),
        });
      });
    }

    return NextResponse.json({ tasks, taskCompletions });
  } catch (error) {
    console.error('Error fetching tasks and completions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks and completions' },
      { status: 500 }
    );
  }
}

