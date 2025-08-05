import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';

export async function GET(request: NextRequest) {
  try {
    // Get the rezTaskMasterEmailAddress from query parameters
    const { searchParams } = new URL(request.url);
    const rezTaskMasterEmailAddress = searchParams.get('rezTaskMasterEmailAddress');

    if (!rezTaskMasterEmailAddress) {
      return NextResponse.json(
        { error: 'rezTaskMasterEmailAddress is required' },
        { status: 400 }
      );
    }

    // First, get all tasks for the given rezTaskMasterEmailAddress
    const tasksRef = paxDB.collection('tasks');
    const tasksSnapshot = await tasksRef.where('rezTaskMasterEmailAddress', '==', rezTaskMasterEmailAddress).get();
    
    const taskIds: string[] = [];
    tasksSnapshot.forEach((doc) => {
      taskIds.push(doc.id);
    });

    if (taskIds.length === 0) {
      return NextResponse.json({ taskCompletions: [] });
    }

    // Then, get all task completions where taskId matches any of the task IDs
    const taskCompletionsRef = paxDB.collection('task_completions');
    const taskCompletionsSnapshot = await taskCompletionsRef.where('taskId', 'in', taskIds).get();

    const taskCompletions: any[] = [];
    taskCompletionsSnapshot.forEach((doc) => {
      taskCompletions.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return NextResponse.json({ taskCompletions });
  } catch (error) {
    console.error('Error fetching task completions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task completions' },
      { status: 500 }
    );
  }
} 