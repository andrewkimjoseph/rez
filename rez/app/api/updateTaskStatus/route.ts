import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { rezDB, paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { updateTaskStatusInPaxApp } from '@/firebase/firestore/services/updateTaskStatusInPaxApp';
import { syncPollFromFirestoreTask } from '@/services/syncPollPublication';

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { taskId, isAvailable } = body as {
      taskId?: string;
      isAvailable?: boolean;
    };

    if (!taskId || typeof isAvailable !== 'boolean') {
      return NextResponse.json(
        { error: 'taskId and isAvailable are required' },
        { status: 400 },
      );
    }

    const userDocRef = rezDB.collection(COLLECTIONS.TASK_MASTERS).doc(authResult.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Unauthorized: User not found' }, { status: 403 });
    }

    const userEmail = (authResult.email || userDoc.data()?.emailAddress)?.toLowerCase().trim();
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 401 });
    }

    await updateTaskStatusInPaxApp({
      taskId,
      isAvailable,
      rezTaskMasterEmailAddress: userEmail,
    });

    const taskDoc = await paxDB.collection(COLLECTIONS.TASKS).doc(taskId).get();
    const taskData = taskDoc.data();
    if (taskData?.type === 'answerPoll') {
      try {
        await syncPollFromFirestoreTask(taskId);
      } catch (syncError) {
        console.error('Failed to sync poll publication after status update:', syncError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating task status:', error);
    const message = error instanceof Error ? error.message : 'Failed to update task status';
    const status = message.includes('Unauthorized') ? 403 : message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
