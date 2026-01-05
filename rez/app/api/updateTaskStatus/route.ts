import { NextRequest, NextResponse } from 'next/server';
import { updateTaskStatusInPaxApp } from '@/firebase/firestore/services/updateTaskStatusInPaxApp';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';

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

    // Fetch updated task data for notification
    const taskRef = paxDB.collection(COLLECTIONS.TASKS).doc(taskId);
    const taskDoc = await taskRef.get();
    
    if (taskDoc.exists) {
      const taskData = taskDoc.data();
      
      // Trigger notification about the updated task (fire and forget)
      try {
        const notificationData = {
          taskId,
          title: taskData?.title || '',
          type: taskData?.type || '',
          category: taskData?.category || '',
          difficulty: taskData?.levelOfDifficulty || '',
          rezTaskMasterEmailAddress,
          action: isAvailable ? 'activated' : 'deactivated',
          tallyFormUrl: taskData?.link || undefined,
          estimatedTimeOfCompletionInMinutes: taskData?.estimatedTimeOfCompletionInMinutes || undefined,
          targetNumberOfParticipants: taskData?.targetNumberOfParticipants || undefined,
          rewardAmountPerParticipant: taskData?.rewardAmountPerParticipant || undefined,
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

