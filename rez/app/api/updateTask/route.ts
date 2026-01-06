import { NextRequest, NextResponse } from 'next/server';
import { updateTaskInPaxApp, UpdateTaskData } from '@/firebase/firestore/services/updateTaskInPaxApp';
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
    const { taskId, data } = body as {
      taskId: string;
      data: UpdateTaskData;
    };

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No data provided for update' },
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

    await updateTaskInPaxApp({ taskId, data, rezTaskMasterEmailAddress: authResult.email });

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
          rezTaskMasterEmailAddress: authResult.email,
          action: 'updated' as const,
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
          console.error('Failed to send update notification:', error);
        });
      } catch (error) {
        // Don't fail the task update if notification fails
        console.error('Error sending update notification:', error);
      }
    }

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

