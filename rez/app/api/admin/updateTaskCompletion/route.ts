import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireSuperAdmin } from '@/lib/api-auth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

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
    const { completionId, isValid, timeCompleted } = body;

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

    const updateData: any = {
      isValid,
      timeUpdated: FieldValue.serverTimestamp(),
    };

    // If validating (isValid === true), clear invalidated fields
    if (isValid === true) {
      updateData.invalidatedAt = null;
      updateData.invalidatedBy = null;
      
      // If timeCompleted is provided, convert it to Firestore Timestamp
      if (timeCompleted != null) {
        let timestamp: Timestamp;
        if (typeof timeCompleted === 'number') {
          // If it's milliseconds, convert to seconds
          timestamp = Timestamp.fromDate(new Date(timeCompleted));
        } else if (typeof timeCompleted === 'string') {
          // If it's an ISO string
          timestamp = Timestamp.fromDate(new Date(timeCompleted));
        } else {
          return NextResponse.json(
            { error: 'timeCompleted must be a number (milliseconds) or ISO string' },
            { status: 400 }
          );
        }
        updateData.timeCompleted = timestamp;
      }
    } else {
      // If invalidating (isValid === false), set invalidated fields
      updateData.invalidatedAt = FieldValue.serverTimestamp();
      updateData.invalidatedBy = authResult.email || null;
    }

    await docRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating task completion:', error);
    return NextResponse.json(
      { error: 'Failed to update task completion' },
      { status: 500 }
    );
  }
}
