import { NextRequest, NextResponse } from 'next/server';
import { paxDB, rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/api-auth';

export const runtime = 'edge';

export interface TaskMasterUpdateTaskData {
  type?: 'fillAForm' | 'checkOutApp' | 'doVideoInterview';
  title?: string;
  category?: string;
  difficulty?: string;
  link?: string;
  instructions?: string;
  feedback?: string;
  targetNumberOfParticipants?: number;
  numberOfQuestions?: number;
  numberOfFeedbackQuestions?: number;
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

    // Only allow updating rejected tasks (moving them back to pending)
    if (taskData?.reviewStatus !== 'rejected') {
      return NextResponse.json(
        { error: 'Only rejected tasks can be updated' },
        { status: 400 }
      );
    }

    // Filter out undefined values
    const updateData: Record<string, unknown> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    // Map difficulty to levelOfDifficulty
    if (updateData.difficulty) {
      updateData.levelOfDifficulty = updateData.difficulty;
      delete updateData.difficulty;
    }

    // Ensure reviewStatus is set to pending and reasonsForRejection is cleared
    updateData.reviewStatus = 'pending';
    updateData.reasonsForRejection = [];
    updateData.isAvailable = false; // Not available until approved and published

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the task
    await taskRef.update({
      ...updateData,
      timeUpdated: FieldValue.serverTimestamp(),
    });

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
