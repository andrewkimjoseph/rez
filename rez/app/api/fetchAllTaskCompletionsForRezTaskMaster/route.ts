import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { requireAuth } from '@/lib/api-auth';

// Note: Using Node.js runtime because Firebase Admin SDK requires it
// export const runtime = 'edge';

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

    // First, get all tasks for the authenticated user's email
    const tasksRef = paxDB.collection('tasks');
    const tasksSnapshot = await tasksRef.where('rezTaskMasterEmailAddress', '==', authResult.email).get();
    
    const taskIds: string[] = [];
    tasksSnapshot.forEach((doc) => {
      taskIds.push(doc.id);
    });

    if (taskIds.length === 0) {
      return NextResponse.json({ taskCompletions: [] });
    }

    // Then, get all task completions where taskId matches any of the task IDs
    // Firestore 'in' operator supports up to 30 values, so we need to batch the queries
    const taskCompletionsRef = paxDB.collection('task_completions');
    const taskCompletions: any[] = [];
    
    // Split taskIds into chunks of 30
    const chunkSize = 30;
    for (let i = 0; i < taskIds.length; i += chunkSize) {
      const chunk = taskIds.slice(i, i + chunkSize);
      const taskCompletionsSnapshot = await taskCompletionsRef.where('taskId', 'in', chunk).get();
      
      taskCompletionsSnapshot.forEach((doc) => {
        taskCompletions.push({
          id: doc.id,
          ...doc.data(),
        });
      });
    }

    return NextResponse.json({ taskCompletions });
  } catch (error) {
    console.error('Error fetching task completions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task completions' },
      { status: 500 }
    );
  }
} 