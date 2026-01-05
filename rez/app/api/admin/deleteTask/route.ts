import { NextRequest, NextResponse } from 'next/server';
import { paxDB, rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const adminId = searchParams.get('adminId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    // Verify the user is a super admin by document ID (task masters are in Rez Firestore)
    const adminDocRef = rezDB.collection(COLLECTIONS.TASK_MASTERS).doc(adminId);
    const adminDoc = await adminDocRef.get();

    if (!adminDoc.exists) {
      return NextResponse.json(
        { error: 'Unauthorized: User not found' },
        { status: 403 }
      );
    }

    const adminData = adminDoc.data();
    if (adminData?.isSuperAdmin !== true) {
      return NextResponse.json(
        { error: 'Unauthorized: Not a super admin' },
        { status: 403 }
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
        rezTaskMasterEmailAddress: taskData?.rezTaskMasterEmailAddress || adminData?.emailAddress,
        action: 'deleted',
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

