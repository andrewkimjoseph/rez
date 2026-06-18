import { NextRequest, NextResponse } from 'next/server';
import { paxDB, rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { FieldValue } from 'firebase-admin/firestore';
import { updatePollInInsights, syncPollFromFirestoreTask } from '@/services/syncPollPublication';
import { getPollResponseCount } from '@/services/fetchPollContent';
import { requireAuth } from '@/lib/api-auth';
import type { PollQuestionDraft } from '@/types/poll';
import { validatePollQuestions } from '@/types/poll';

export interface TaskMasterUpdateTaskData {
  type?: 'fillAForm' | 'checkOutApp' | 'doVideoInterview' | 'answerPoll';
  title?: string;
  category?: string;
  difficulty?: string;
  link?: string;
  instructions?: string;
  feedback?: string;
  targetNumberOfParticipants?: number;
  numberOfQuestions?: number;
  numberOfFeedbackQuestions?: number;
  pollQuestions?: PollQuestionDraft[];
  reviewStatus?: 'pending' | 'approved' | 'rejected' | 'published' | 'archived';
  reasonsForRejection?: number[];
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { taskId, data } = body as {
      taskId: string;
      data: TaskMasterUpdateTaskData;
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

    // Get user document to retrieve email address
    // Note: All authenticated users are task masters in this system
    const userDocRef = rezDB.collection(COLLECTIONS.TASK_MASTERS).doc(authResult.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Unauthorized: User not found' },
        { status: 403 }
      );
    }

    const userData = userDoc.data();
    
    // Get user email - prefer from auth token, fallback to Firestore document
    const userEmail = (authResult.email || userData?.emailAddress)?.toLowerCase().trim();

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 401 }
      );
    }

    // Verify task exists
    const taskRef = paxDB.collection(COLLECTIONS.TASKS).doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const taskData = taskDoc.data();

    // Normalize task master email for comparison
    const taskMasterEmail = taskData?.rezTaskMasterEmailAddress?.toLowerCase().trim();

    if (!taskMasterEmail) {
      return NextResponse.json(
        { error: 'Task has no assigned task master' },
        { status: 400 }
      );
    }

    // Verify task belongs to current user (case-insensitive comparison)
    if (taskMasterEmail !== userEmail) {
      return NextResponse.json(
        { error: 'You do not have permission to update this task. This task belongs to another task master.' },
        { status: 403 }
      );
    }

    const wasRejected = taskData?.reviewStatus === 'rejected';
    const isPollTask = taskData?.type === 'answerPoll';
    const hasPollQuestions = data.pollQuestions !== undefined;
    let canEditPollQuestions = false;

    if (isPollTask && hasPollQuestions) {
      const responseCount = await getPollResponseCount(taskId);
      canEditPollQuestions = responseCount === 0;
    }

    if (!wasRejected && !canEditPollQuestions) {
      return NextResponse.json(
        { error: 'Only rejected tasks can be updated, or polls with no responses for question edits' },
        { status: 400 }
      );
    }

    if (wasRejected) {
      const updateData: Record<string, unknown> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[key] = value;
        }
      });

      if (updateData.difficulty) {
        updateData.levelOfDifficulty = updateData.difficulty;
        delete updateData.difficulty;
      }

      updateData.reviewStatus = 'pending';
      updateData.reasonsForRejection = [];
      updateData.isAvailable = false;

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: 'No valid fields to update' },
          { status: 400 }
        );
      }

      await taskRef.update({
        ...updateData,
        timeUpdated: FieldValue.serverTimestamp(),
      });
    } else if (canEditPollQuestions && (data.instructions !== undefined || data.title !== undefined)) {
      const lightUpdate: Record<string, unknown> = {};
      if (data.instructions !== undefined) lightUpdate.instructions = data.instructions;
      if (data.title !== undefined) lightUpdate.title = data.title;
      if (Object.keys(lightUpdate).length > 0) {
        await taskRef.update({
          ...lightUpdate,
          timeUpdated: FieldValue.serverTimestamp(),
        });
      }
    }

    if (isPollTask && hasPollQuestions) {
      try {
        if (data.pollQuestions) {
          const pollValidation = validatePollQuestions(data.pollQuestions);
          if (pollValidation) {
            return NextResponse.json({ error: pollValidation }, { status: 400 });
          }
        }
        await updatePollInInsights(taskId, {
          title: data.title,
          category: data.category,
          targetNumberOfParticipants: data.targetNumberOfParticipants,
          pollQuestions: data.pollQuestions,
          reviewStatus: wasRejected ? 'pending' : undefined,
        });
        if (wasRejected) {
          await syncPollFromFirestoreTask(taskId);
        }
      } catch (syncError) {
        const message = syncError instanceof Error ? syncError.message : 'Failed to update poll';
        const status = message.includes('cannot be changed') ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
      }
    }

    // Fetch updated task for notification
    const updatedTaskDoc = await taskRef.get();
    const updatedTaskData = updatedTaskDoc.data();

    // Send Telegram notification (fire and forget)
    try {
      const notificationData = {
        taskId,
        title: updatedTaskData?.title || taskData?.title || '',
        type: updatedTaskData?.type || taskData?.type || '',
        category: updatedTaskData?.category || taskData?.category || '',
        difficulty: updatedTaskData?.levelOfDifficulty || taskData?.levelOfDifficulty || '',
        rezTaskMasterEmailAddress: taskMasterEmail,
        action: 'updated' as const,
        updatedByEmail: userEmail,
        estimatedTimeOfCompletionInMinutes: updatedTaskData?.estimatedTimeOfCompletionInMinutes,
        targetNumberOfParticipants: updatedTaskData?.targetNumberOfParticipants,
        rewardAmountPerParticipant: updatedTaskData?.rewardAmountPerParticipant,
      };

      const internalToken = process.env.INTERNAL_API_TOKEN;
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifyRezTotifierOfUpdatedOrDeletedTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(internalToken && { 'x-internal-token': internalToken }),
        },
        body: JSON.stringify(notificationData),
      }).catch(error => {
        console.error('Failed to send Telegram notification for task update:', error);
      });
    } catch {
      // Ignore notification errors
    }

    return NextResponse.json({
      success: true,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}
