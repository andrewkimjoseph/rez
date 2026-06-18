import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireSuperAdmin } from '@/lib/api-auth';

/**
 * Permanently deletes a task completion (admin only).
 * Blocked when a reward has already been claimed for the completion.
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const completionId = searchParams.get('completionId');

    if (!completionId) {
      return NextResponse.json(
        { error: 'completionId is required' },
        { status: 400 }
      );
    }

    const completionsRef = paxDB.collection(COLLECTIONS.TASK_COMPLETIONS);
    const docRef = completionsRef.doc(completionId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Task completion not found' },
        { status: 404 }
      );
    }

    const rewardsSnapshot = await paxDB
      .collection(COLLECTIONS.REWARDS)
      .where('taskCompletionId', '==', completionId)
      .where('isPaidOutToPaxAccount', '==', true)
      .limit(1)
      .get();

    if (!rewardsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Cannot delete completion: reward already claimed' },
        { status: 409 }
      );
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task completion:', error);
    return NextResponse.json(
      { error: 'Failed to delete task completion' },
      { status: 500 }
    );
  }
}
