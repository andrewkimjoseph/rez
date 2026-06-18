import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { paxDB, rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { fetchPollContentByPaxTaskId } from '@/services/fetchPollContent';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { taskId } = await params;
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const taskDoc = await paxDB.collection(COLLECTIONS.TASKS).doc(taskId).get();
    if (!taskDoc.exists) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const taskData = taskDoc.data();
    const userDoc = await rezDB.collection(COLLECTIONS.TASK_MASTERS).doc(authResult.uid).get();
    const userEmail = (authResult.email || userDoc.data()?.emailAddress)?.toLowerCase().trim();
    const taskMasterEmail = taskData?.rezTaskMasterEmailAddress?.toLowerCase().trim();
    const isSuperAdmin = userDoc.data()?.isSuperAdmin === true;

    if (!isSuperAdmin && userEmail !== taskMasterEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (taskData?.type !== 'answerPoll') {
      return NextResponse.json({ error: 'Task is not a poll' }, { status: 400 });
    }

    const content = await fetchPollContentByPaxTaskId(taskId);
    if (!content) {
      return NextResponse.json({ error: 'Poll content not found' }, { status: 404 });
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching poll content:', error);
    return NextResponse.json({ error: 'Failed to fetch poll content' }, { status: 500 });
  }
}
