import { NextRequest, NextResponse } from 'next/server';
import { updateTaskStatusInPaxApp } from '@/firebase/firestore/services/updateTaskStatusInPaxApp';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, isAvailable, rezTaskMasterEmailAddress } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing required parameter: taskId' },
        { status: 400 }
      );
    }

    if (typeof isAvailable !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid parameter: isAvailable must be a boolean' },
        { status: 400 }
      );
    }

    if (!rezTaskMasterEmailAddress) {
      return NextResponse.json(
        { error: 'Missing required parameter: rezTaskMasterEmailAddress' },
        { status: 400 }
      );
    }

    await updateTaskStatusInPaxApp({
      taskId,
      isAvailable,
      rezTaskMasterEmailAddress,
    });

    return NextResponse.json({
      success: true,
      message: `Task ${isAvailable ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update task status';
    
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
      { error: 'Failed to update task status' },
      { status: 500 }
    );
  }
}

