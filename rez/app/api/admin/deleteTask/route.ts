import { NextRequest, NextResponse } from 'next/server';
import { paxDB, rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireSuperAdmin } from '@/lib/api-auth';

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication and super admin status
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Get admin data for notification
    const adminDocRef = rezDB.collection(COLLECTIONS.TASK_MASTERS).doc(authResult.uid);
    const adminDoc = await adminDocRef.get();
    const adminData = adminDoc.data();
    
    // Get admin email - prefer from auth token, fallback to Firestore document
    const adminEmail = authResult.email || adminData?.emailAddress || 'Unknown';

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

    // Delete the task
    await taskRef.delete();

    // Send notification (fire and forget)
    try {
      const notificationData = {
        taskId,
        title: taskData?.title || '',
        type: taskData?.type || '',
        category: taskData?.category || '',
        difficulty: taskData?.levelOfDifficulty || '',
        rezTaskMasterEmailAddress: taskData?.rezTaskMasterEmailAddress || adminEmail,
        action: 'deleted',
        updatedByEmail: adminEmail,
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
        console.error('Failed to send Telegram notification for task delete:', error);
      });
    } catch {
      // Ignore notification errors
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

