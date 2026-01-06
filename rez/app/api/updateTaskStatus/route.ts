import { NextRequest, NextResponse } from 'next/server';
import { updateTaskStatusInPaxApp } from '@/firebase/firestore/services/updateTaskStatusInPaxApp';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireAuth } from '@/lib/api-auth';

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { taskId, isAvailable } = body;

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

    // Verify task ownership before updating
    const taskRef = paxDB.collection(COLLECTIONS.TASKS).doc(taskId);
    const taskDoc = await taskRef.get();
    
    if (!taskDoc.exists) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const taskData = taskDoc.data();
    
    if (taskData?.rezTaskMasterEmailAddress !== authResult.email) {
      return NextResponse.json(
        { error: 'Unauthorized: Task does not belong to this task master' },
        { status: 403 }
      );
    }

    await updateTaskStatusInPaxApp({
      taskId,
      isAvailable,
      rezTaskMasterEmailAddress: authResult.email,
    });

    // Fetch updated task data for notification
    const updatedTaskDoc = await taskRef.get();
    
    if (updatedTaskDoc.exists) {
      const updatedTaskData = updatedTaskDoc.data();
      
      // Trigger notification about the updated task (fire and forget)
      try {
        const notificationData = {
          taskId,
          title: updatedTaskData?.title || '',
          type: updatedTaskData?.type || '',
          category: updatedTaskData?.category || '',
          difficulty: updatedTaskData?.levelOfDifficulty || '',
          rezTaskMasterEmailAddress: authResult.email,
          action: isAvailable ? 'activated' : 'deactivated',
          tallyFormUrl: updatedTaskData?.link || undefined,
          estimatedTimeOfCompletionInMinutes: updatedTaskData?.estimatedTimeOfCompletionInMinutes || undefined,
          targetNumberOfParticipants: updatedTaskData?.targetNumberOfParticipants || undefined,
          rewardAmountPerParticipant: updatedTaskData?.rewardAmountPerParticipant || undefined,
        };

        // Send notification without awaiting (fire and forget)
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifyRezTotifierOfUpdatedOrDeletedTask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationData),
        }).catch(error => {
          // Silently handle notification errors
          console.error('Failed to send status update notification:', error);
        });
      } catch (error) {
        // Don't fail the task status update if notification fails
        console.error('Error sending status update notification:', error);
      }
    }

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

