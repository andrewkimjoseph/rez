import { NextRequest, NextResponse } from 'next/server';
import { paxDB, rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { FieldValue } from 'firebase-admin/firestore';
import { requireSuperAdmin } from '@/lib/api-auth';

export interface AdminUpdateTaskData {
  title?: string;
  type?: 'fillAForm' | 'checkOutApp' | 'doVideoInterview';
  category?: string;
  levelOfDifficulty?: string;
  link?: string;
  instructions?: string;
  feedback?: string;
  targetCountry?: string;
  isAvailable?: boolean;
  isTest?: boolean;
  estimatedTimeOfCompletionInMinutes?: number;
  targetNumberOfParticipants?: number;
  rewardAmountPerParticipant?: number;
  rewardCurrencyId?: number;
  numberOfCooldownHours?: number;
  paymentTerms?: string;
  managerContractAddress?: string;
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication and super admin status
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { taskId, data } = body as {
      taskId: string;
      data: AdminUpdateTaskData;
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

    // Get admin data for notification
    const adminDocRef = rezDB.collection(COLLECTIONS.TASK_MASTERS).doc(authResult.uid);
    const adminDoc = await adminDocRef.get();
    const adminData = adminDoc.data();

    // Verify task exists
    const taskRef = paxDB.collection(COLLECTIONS.TASKS).doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Filter out undefined values
    const updateData: Record<string, unknown> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

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

    // Fetch updated task for notification
    const updatedTaskDoc = await taskRef.get();
    const taskData = updatedTaskDoc.data();

    // Send notification (fire and forget)
    try {
      const notificationData = {
        taskId,
        title: taskData?.title || '',
        type: taskData?.type || '',
        category: taskData?.category || '',
        difficulty: taskData?.levelOfDifficulty || '',
        rezTaskMasterEmailAddress: taskData?.rezTaskMasterEmailAddress || adminData?.emailAddress,
        action: 'updated',
        estimatedTimeOfCompletionInMinutes: taskData?.estimatedTimeOfCompletionInMinutes,
        targetNumberOfParticipants: taskData?.targetNumberOfParticipants,
        rewardAmountPerParticipant: taskData?.rewardAmountPerParticipant,
      };

      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifyRezTotifierOfUpdatedOrDeletedTask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      }).catch(() => {});
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

