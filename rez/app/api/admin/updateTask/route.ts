import { NextRequest, NextResponse } from 'next/server';
import { paxDB, rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { syncPollFromFirestoreTask, updatePollInInsights } from '@/services/syncPollPublication';
import { requireSuperAdmin } from '@/lib/api-auth';
import type { PollQuestionDraft } from '@/types/poll';
import { validatePollQuestions, validatePollQuestionsTextOnly } from '@/types/poll';
import { fetchPollContentByPaxTaskId } from '@/services/fetchPollContent';
import { SPAM_CONTENT_REJECTION_REASON_ID } from '@/utils/rejection-reasons';

export interface AdminUpdateTaskData {
  title?: string;
  type?: 'fillAForm' | 'checkOutApp' | 'doVideoInterview' | 'answerPoll';
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
  deadline?: string | null; // ISO date string; null to clear
  paymentTerms?: string | null;
  managerContractAddress?: string;
  reviewStatus?: 'pending' | 'approved' | 'rejected' | 'published' | 'archived';
  reasonsForRejection?: number[]; // Array of rejection reason IDs (1-9)
  pollQuestions?: PollQuestionDraft[];
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
    const oldReasonsForRejection = Array.isArray(oldTaskData?.reasonsForRejection)
      ? (oldTaskData?.reasonsForRejection as number[])
      : [];
    const pollQuestions = data.pollQuestions;
    const hasPollQuestionUpdate = pollQuestions !== undefined;

    // Filter out undefined values and convert deadline to Timestamp
    const updateData: Record<string, unknown> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined) return;
      if (key === 'pollQuestions') return;
      if (key === 'deadline') {
        updateData.deadline = value === null ? null : Timestamp.fromDate(new Date(value as string));
        return;
      }
      updateData[key] = value;
    });

    // Keep availability in sync for clearly inactive states, but do not
    // automatically activate tasks when they are published.
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

    if (Object.keys(updateData).length === 0 && !hasPollQuestionUpdate) {
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
    if (Object.keys(updateData).length > 0) {
      await taskRef.update({
        ...updateData,
        timeUpdated: FieldValue.serverTimestamp(),
      });
    }

    const updatedTaskDoc = await taskRef.get();
    const taskData = updatedTaskDoc.data();
    const updatedReviewStatus = (taskData?.reviewStatus ?? oldReviewStatus) as string | undefined;
    const updatedReasonsForRejection = Array.isArray(taskData?.reasonsForRejection)
      ? (taskData?.reasonsForRejection as number[])
      : [];

    const hadSpamRejection =
      oldReviewStatus === 'rejected' &&
      oldReasonsForRejection.includes(SPAM_CONTENT_REJECTION_REASON_ID);
    const hasSpamRejectionNow =
      updatedReviewStatus === 'rejected' &&
      updatedReasonsForRejection.includes(SPAM_CONTENT_REJECTION_REASON_ID);

    const taskMasterEmailRaw = taskData?.rezTaskMasterEmailAddress;
    const taskMasterEmail =
      typeof taskMasterEmailRaw === 'string' ? taskMasterEmailRaw.trim() : null;

    if (taskMasterEmail && (hadSpamRejection !== hasSpamRejectionNow)) {
      const taskMasterSnapshot = await rezDB
        .collection(COLLECTIONS.TASK_MASTERS)
        .where('emailAddress', '==', taskMasterEmail)
        .limit(1)
        .get();

      if (!taskMasterSnapshot.empty) {
        const taskMasterRef = taskMasterSnapshot.docs[0].ref;

        if (hasSpamRejectionNow) {
          await taskMasterRef.update({
            taskCreationBlocked: true,
            taskCreationBlockReason: 'spam_content',
            taskCreationBlockedAt: FieldValue.serverTimestamp(),
            timeUpdated: FieldValue.serverTimestamp(),
          });
        } else {
          // Only clear block when there are no other rejected spam tasks for this task master
          const siblingRejectedTasks = await paxDB
            .collection(COLLECTIONS.TASKS)
            .where('rezTaskMasterEmailAddress', '==', taskMasterEmail)
            .where('reviewStatus', '==', 'rejected')
            .get();

          const hasAnyOtherSpamRejectedTask = siblingRejectedTasks.docs.some((doc) => {
            if (doc.id === taskId) return false;
            const reasons = doc.data()?.reasonsForRejection;
            return Array.isArray(reasons) && reasons.includes(SPAM_CONTENT_REJECTION_REASON_ID);
          });

          if (!hasAnyOtherSpamRejectedTask) {
            await taskMasterRef.update({
              taskCreationBlocked: false,
              taskCreationBlockReason: null,
              taskCreationBlockedAt: null,
              timeUpdated: FieldValue.serverTimestamp(),
            });
          }
        }
      }
    }

    const updatedTaskType = (updateData.type as string | undefined) ?? taskData?.type;
    if (updatedTaskType === 'answerPoll') {
      try {
        if (hasPollQuestionUpdate) {
          const existing = await fetchPollContentByPaxTaskId(taskId);
          if (!existing) {
            return NextResponse.json(
              { error: 'Poll content not found in Insights' },
              { status: 404 },
            );
          }

          if (existing.responseCount > 0) {
            const textOnlyError = validatePollQuestionsTextOnly(
              existing.pollQuestions,
              pollQuestions!,
            );
            if (textOnlyError) {
              return NextResponse.json({ error: textOnlyError }, { status: 400 });
            }
          } else {
            const validationError = validatePollQuestions(pollQuestions);
            if (validationError) {
              return NextResponse.json({ error: validationError }, { status: 400 });
            }
          }

          await updatePollInInsights(
            taskId,
            { pollQuestions },
            { adminOverride: true },
          );
        }
        await syncPollFromFirestoreTask(taskId);
      } catch (syncError) {
        const message = syncError instanceof Error ? syncError.message : 'Failed to update poll';
        const status = message.includes('cannot') || message.includes('Cannot') ? 400 : 500;
        console.error('Failed to sync poll to Insights:', syncError);
        return NextResponse.json({ error: message }, { status });
      }
    }

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
      // Ignore notification errors - don't fail the main request
    }

    // Send email notification via Resend based on review status change (fire and forget)
    if (newReviewStatus && newReviewStatus !== oldReviewStatus) {
      try {
        const taskMasterEmail = taskData?.rezTaskMasterEmailAddress;
        
        if (taskMasterEmail) {
          // Get task master ID from email
          const taskMasterSnapshot = await rezDB.collection(COLLECTIONS.TASK_MASTERS)
            .where('emailAddress', '==', taskMasterEmail)
            .limit(1)
            .get();

          if (!taskMasterSnapshot.empty) {
            const taskMasterDoc = taskMasterSnapshot.docs[0];
            const taskMasterName = taskMasterDoc.data()?.name || taskMasterDoc.data()?.displayName || 'Task Master';
            let emailTemplate: 'taskRejected' | 'taskApproved' | 'taskPublished' | 'taskCompleted' | null = null;

            // Map review status to email template
            if (newReviewStatus === 'rejected') {
              emailTemplate = 'taskRejected';
            } else if (newReviewStatus === 'approved') {
              emailTemplate = 'taskApproved';
            } else if (newReviewStatus === 'published') {
              emailTemplate = 'taskPublished';
            } else if (newReviewStatus === 'archived') {
              emailTemplate = 'taskCompleted';
            }

            if (emailTemplate) {
              // Send email without awaiting (fire and forget)
              // Use internal token for server-side calls
              const internalToken = process.env.INTERNAL_API_TOKEN;
              fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sendResendEmail`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(internalToken && { 'x-internal-token': internalToken }), // Internal server-side call token
                },
                body: JSON.stringify({
                  to: [taskMasterEmail],
                  template: emailTemplate,
                  variables: {
                    taskMasterName,
                    taskId,
                  },
                }),
              }).catch(error => {
                // Silently handle email errors
                console.error(`Failed to send ${emailTemplate} email:`, error);
              });
            }
          }
        }
      } catch (error) {
        // Don't fail the task update if email fails
        console.error('Error sending email notification:', error);
      }
    }

    // Send taskActivated email when task is activated (isAvailable set to true)
    if (action === 'activated') {
      try {
        const taskMasterEmail = taskData?.rezTaskMasterEmailAddress;
        if (taskMasterEmail) {
          const taskMasterSnapshot = await rezDB.collection(COLLECTIONS.TASK_MASTERS)
            .where('emailAddress', '==', taskMasterEmail)
            .limit(1)
            .get();
          if (!taskMasterSnapshot.empty) {
            const taskMasterDoc = taskMasterSnapshot.docs[0];
            const taskMasterName = taskMasterDoc.data()?.name || taskMasterDoc.data()?.displayName || 'Task Master';
            const internalToken = process.env.INTERNAL_API_TOKEN;
            fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sendResendEmail`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(internalToken && { 'x-internal-token': internalToken }),
              },
              body: JSON.stringify({
                to: [taskMasterEmail],
                template: 'taskActivated',
                variables: {
                  taskMasterName,
                  taskId,
                },
              }),
            }).catch(error => {
              console.error('Failed to send taskActivated email:', error);
            });
          }
        }
      } catch (error) {
        console.error('Error sending taskActivated email:', error);
      }
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

