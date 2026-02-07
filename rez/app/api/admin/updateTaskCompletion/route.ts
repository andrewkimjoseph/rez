import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireSuperAdmin } from '@/lib/api-auth';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Updates isValid on a task completion (admin only).
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { completionId, isValid } = body;

    if (completionId == null || typeof completionId !== 'string') {
      return NextResponse.json(
        { error: 'completionId is required' },
        { status: 400 }
      );
    }

    if (typeof isValid !== 'boolean') {
      return NextResponse.json(
        { error: 'isValid must be a boolean' },
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

    await docRef.update({
      isValid,
      timeUpdated: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating task completion:', error);
    return NextResponse.json(
      { error: 'Failed to update task completion' },
      { status: 500 }
    );
  }
}
