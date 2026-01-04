import { NextRequest, NextResponse } from 'next/server';
import { updateTaskInPaxApp, UpdateTaskData } from '@/firebase/firestore/services/updateTaskInPaxApp';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, data, rezTaskMasterEmailAddress } = body as {
      taskId: string;
      data: UpdateTaskData;
      rezTaskMasterEmailAddress: string;
    };

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    if (!rezTaskMasterEmailAddress) {
      return NextResponse.json(
        { error: 'Task Master Email Address is required' },
        { status: 400 }
      );
    }

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No data provided for update' },
        { status: 400 }
      );
    }

    await updateTaskInPaxApp({ taskId, data, rezTaskMasterEmailAddress });

    return NextResponse.json({ 
      success: true, 
      message: 'Task updated successfully' 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Task not found')) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    if (errorMessage.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized to update this task' },
        { status: 403 }
      );
    }
    if (errorMessage.includes('No valid fields')) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

