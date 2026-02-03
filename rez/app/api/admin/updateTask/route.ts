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
  numberOfQuestions?: number;
  numberOfFeedbackQuestions?: number;
  rewardAmountPerParticipant?: number;
  rewardCurrencyId?: number;
  numberOfCooldownHours?: number;
  paymentTerms?: string;
  managerContractAddress?: string;
  reviewStatus?: 'pending' | 'approved' | 'rejected' | 'published' | 'archived';
  reasonsForRejection?: number[]; // Array of rejection reason IDs (1-8)
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
    
    // Get admin email - prefer from auth token, fallback to Firestore document
    const adminEmail = authResult.email || adminData?.emailAddress || 'Unknown';

    // Verify task exists
    const taskRef = paxDB.collection(COLLECTIONS.TASKS).doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const oldTaskData = taskDoc.data();
    const oldIsAvailable = oldTaskData?.isAvailable;
    const oldReviewStatus = oldTaskData?.reviewStatus;

    // Filter out undefined values
    const updateData: Record<string, unknown> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    // isAvailable is true only when reviewStatus is 'published' (after approval + payment)
    if (updateData.reviewStatus === 'published' && oldReviewStatus !== 'published') {
      updateData.isAvailable = true;
    }
    if (updateData.reviewStatus === 'rejected' || updateData.reviewStatus === 'archived') {
      updateData.isAvailable = false;
    }
    if (updateData.reviewStatus === 'approved' && (oldReviewStatus === 'published' || oldReviewStatus === 'archived')) {
      updateData.isAvailable = false;
    }

    // Clear reasonsForRejection when status changes from rejected to pending or approved
    if (updateData.reviewStatus && updateData.reviewStatus !== 'rejected' && oldReviewStatus === 'rejected') {
      updateData.reasonsForRejection = [];
    }
    
    // Clear reasonsForRejection if explicitly set to empty array (when approving)
    if (updateData.reasonsForRejection && Array.isArray(updateData.reasonsForRejection) && updateData.reasonsForRejection.length === 0) {
      updateData.reasonsForRejection = [];
    }

    // If super admin is reassigning task to different task master, validate the email
    if (updateData.rezTaskMasterEmailAddress) {
      const newTaskMasterEmail = updateData.rezTaskMasterEmailAddress as string;
      const taskMasterRef = rezDB.collection(COLLECTIONS.TASK_MASTERS)
        .where('emailAddress', '==', newTaskMasterEmail)
        .limit(1);
      const taskMasterSnapshot = await taskMasterRef.get();
      
      if (taskMasterSnapshot.empty) {
        return NextResponse.json(
          { error: 'Invalid task master email address' },
          { status: 400 }
        );
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Determine action type based on what changed
    const newReviewStatus = updateData.reviewStatus as string | undefined;
    const newIsAvailable = updateData.isAvailable as boolean | undefined;
    let action: 'updated' | 'activated' | 'deactivated' | 'approved' | 'rejected' | 'published' | 'archived' = 'updated';
    
    // Check for review status changes first
    if (newReviewStatus && newReviewStatus !== oldReviewStatus) {
      if (newReviewStatus === 'approved') {
        action = 'approved';
      } else if (newReviewStatus === 'rejected') {
        action = 'rejected';
      } else if (newReviewStatus === 'published') {
        action = 'published';
      } else if (newReviewStatus === 'archived') {
        action = 'archived';
      }
    } else {
      // Check for availability toggle (only if not a review action)
      const isStatusChange = 'isAvailable' in updateData && Object.keys(updateData).length === 1;
      if (isStatusChange && typeof newIsAvailable === 'boolean' && typeof oldIsAvailable === 'boolean') {
        action = newIsAvailable ? 'activated' : 'deactivated';
      }
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
        rezTaskMasterEmailAddress: taskData?.rezTaskMasterEmailAddress || adminEmail,
        action,
        updatedByEmail: adminEmail,
        estimatedTimeOfCompletionInMinutes: taskData?.estimatedTimeOfCompletionInMinutes,
        targetNumberOfParticipants: taskData?.targetNumberOfParticipants,
        rewardAmountPerParticipant: taskData?.rewardAmountPerParticipant,
      };

      // Fire and forget - don't await to avoid blocking the response
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifyRezTotifierOfUpdatedOrDeletedTask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      }).catch(() => {
        // Ignore notification errors
      });
    } catch {
      // Ignore notification errors - don't fail the main request
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

