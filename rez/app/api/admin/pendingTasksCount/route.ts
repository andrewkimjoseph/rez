import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireSuperAdmin } from '@/lib/api-auth';

/**
 * Returns the count of tasks with reviewStatus === 'pending'.
 * Uses Firestore count aggregation (cheaper than fetching all docs).
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const tasksRef = paxDB.collection(COLLECTIONS.TASKS);
    const query = tasksRef.where('reviewStatus', '==', 'pending');
    const snapshot = await query.count().get();
    const count = snapshot.data().count;

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching pending tasks count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending tasks count' },
      { status: 500 }
    );
  }
}
