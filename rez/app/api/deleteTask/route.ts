import { NextRequest, NextResponse } from 'next/server';
import { deleteTaskFromPaxApp } from '@/firebase/firestore/services/deleteTaskFromPaxApp';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const rezTaskMasterEmailAddress = searchParams.get('rezTaskMasterEmailAddress');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing required parameter: taskId' },
        { status: 400 }
      );
    }

    if (!rezTaskMasterEmailAddress) {
      return NextResponse.json(
        { error: 'Missing required parameter: rezTaskMasterEmailAddress' },
        { status: 400 }
      );
    }

    await deleteTaskFromPaxApp({
      taskId,
      rezTaskMasterEmailAddress,
    });

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
    
    if (errorMessage === 'Task not found') {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      );
    }
    
    if (errorMessage.includes('Unauthorized')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

