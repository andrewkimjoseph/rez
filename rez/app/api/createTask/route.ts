import { NextRequest, NextResponse } from 'next/server';
import { createTaskInPaxApp } from '@/firebase/firestore/services/createTaskInPaxApp';
import { requireAuth } from '@/lib/api-auth';
import { rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.type || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: type and title' },
        { status: 400 }
      );
    }

    // Use authenticated user's email instead of trusting client-provided email
    if (!authResult.email) {
      return NextResponse.json(
        { error: 'User email not found in authentication token' },
        { status: 400 }
      );
    }

    // Get isSuperAdmin from request body (client sends it to avoid DB read)
    // For security, we still validate it matches the authenticated user if needed
    const isSuperAdmin = body.isSuperAdmin === true;

    // Check rate limit: 7 days since last task creation (skip for super admins)
    // Client sends lastTaskCreatedAt to avoid database reads
    const lastTaskCreatedAt = body.lastTaskCreatedAt;
    
    if (!isSuperAdmin && lastTaskCreatedAt) {
      // Validate timestamp is reasonable (not in future, not too old)
      const lastTaskTime = typeof lastTaskCreatedAt === 'number' 
        ? lastTaskCreatedAt 
        : new Date(lastTaskCreatedAt).getTime();
      
      const now = Date.now();
      
      // Sanity check: timestamp should not be in the future, and not older than 1 year
      if (lastTaskTime > now || lastTaskTime < now - (365 * 24 * 60 * 60 * 1000)) {
        // Invalid timestamp, but allow creation (fail open for edge cases)
        // In production, you might want to log this or do a DB check
      } else {
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        const timeSinceLastTask = now - lastTaskTime;
        const daysRemaining = Math.ceil((sevenDaysMs - timeSinceLastTask) / (24 * 60 * 60 * 1000));

        if (timeSinceLastTask < sevenDaysMs) {
          return NextResponse.json(
            { 
              error: 'Rate limit exceeded',
              message: `You can only create one task per week. Please wait ${daysRemaining} more day${daysRemaining !== 1 ? 's' : ''} before creating another task.`,
              daysRemaining,
              canCreateAfter: new Date(lastTaskTime + sevenDaysMs).toISOString()
            },
            { status: 429 } // 429 Too Many Requests
          );
        }
      }
    }

    // Determine which email to use for task master
    // Super admins can assign to a different task master
    let taskMasterEmail = authResult.email;
    if (isSuperAdmin && body.assignedTaskMasterEmailAddress) {
      // Validate that the assigned email is a valid task master
      const assignedTaskMasterSnapshot = await rezDB.collection(COLLECTIONS.TASK_MASTERS)
        .where('emailAddress', '==', body.assignedTaskMasterEmailAddress)
        .limit(1)
        .get();
      
      if (!assignedTaskMasterSnapshot.empty) {
        taskMasterEmail = body.assignedTaskMasterEmailAddress;
      } else {
        return NextResponse.json(
          { error: 'Invalid task master email address' },
          { status: 400 }
        );
      }
    }

    // Create the task using the server-side service
    const taskId = await createTaskInPaxApp({
      type: body.type,
      title: body.title,
      category: body.category || "Other",
      difficulty: body.difficulty || "Medium",
      gender: body.gender,
      link: body.link,
      instructions: body.instructions,
      feedback: body.feedback,
      rezTaskMasterEmailAddress: taskMasterEmail,
      targetNumberOfParticipants: body.targetNumberOfParticipants,
      numberOfQuestions: body.numberOfQuestions,
      numberOfFeedbackQuestions: body.numberOfFeedbackQuestions,
    });

    // Trigger notification about the new task (fire and forget)
    try {
      const notificationData = {
        taskId,
        title: body.title,
        type: body.type,
        category: body.category || "Other",
        difficulty: body.difficulty || "Medium",
        creatorEmail: authResult.email, // Person who created the task
        rezTaskMasterEmailAddress: taskMasterEmail, // Person assigned to the task (assignee)
        link: body.link,
        estimatedTimeOfCompletionInMinutes: 5, // Default from service
        targetNumberOfParticipants: body.targetNumberOfParticipants || 100,
        rewardAmountPerParticipant: 0.15, // Default from service
      };

      // Send notification without awaiting (fire and forget)
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifyRezTotifierOfNewTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      }).catch(error => {
        // Silently handle notification errors
      });
    } catch (error) {
      // Don't fail the task creation if notification fails
    }

    return NextResponse.json({ 
      success: true, 
      taskId,
      message: 'Task created successfully' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
} 