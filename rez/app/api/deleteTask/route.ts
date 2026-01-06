import { NextRequest, NextResponse } from 'next/server';
import { deleteTaskFromPaxApp } from '@/firebase/firestore/services/deleteTaskFromPaxApp';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireAuth, verifyResourceOwnership } from '@/lib/api-auth';

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing required parameter: taskId' },
        { status: 400 }
      );
    }

    // Fetch task data before deletion for notification
    const taskRef = paxDB.collection(COLLECTIONS.TASKS).doc(taskId);
    const taskDoc = await taskRef.get();
    
    if (!taskDoc.exists) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const taskData = taskDoc.data();
    
    // Verify the authenticated user owns this task
    if (taskData?.rezTaskMasterEmailAddress !== authResult.email) {
      return NextResponse.json(
        { error: 'Unauthorized: Task does not belong to this task master' },
        { status: 403 }
      );
    }

    await deleteTaskFromPaxApp({
      taskId,
      rezTaskMasterEmailAddress: authResult.email,
    });

    // Trigger notification about the deleted task (fire and forget)
    try {
      const notificationData = {
        taskId,
        title: taskData.title || '',
        type: taskData.type || '',
        category: taskData.category || '',
        difficulty: taskData.levelOfDifficulty || '',
        rezTaskMasterEmailAddress: authResult.email,
        action: 'deleted' as const,
        tallyFormUrl: taskData.link || undefined,
        estimatedTimeOfCompletionInMinutes: taskData.estimatedTimeOfCompletionInMinutes || undefined,
        targetNumberOfParticipants: taskData.targetNumberOfParticipants || undefined,
        rewardAmountPerParticipant: taskData.rewardAmountPerParticipant || undefined,
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
        console.error('Failed to send delete notification:', error);
      });
    } catch (error) {
      // Don't fail the task deletion if notification fails
      console.error('Error sending delete notification:', error);
    }

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

