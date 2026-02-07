import { NextRequest, NextResponse } from 'next/server';
import { rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';
import { requireSuperAdmin } from '@/lib/api-auth';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
      MAX_LIMIT
    );
    const startAfterDocId = searchParams.get('startAfterDocId') || undefined;

    const taskMastersRef = rezDB.collection(COLLECTIONS.TASK_MASTERS);
    let query = taskMastersRef.orderBy('timeCreated', 'desc').limit(limit);

    if (startAfterDocId) {
      const lastDoc = await taskMastersRef.doc(startAfterDocId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const taskMastersSnapshot = await query.get();
    const auth = getAuth(getApp('rezApp'));

    const taskMasters = await Promise.all(
      taskMastersSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        let disabled = false;

        try {
          const userRecord = await auth.getUser(doc.id);
          disabled = userRecord.disabled;
        } catch {
          disabled = false;
        }

        return {
          id: doc.id,
          ...data,
          disabled,
        };
      })
    );

    const lastDoc = taskMastersSnapshot.docs[taskMastersSnapshot.docs.length - 1];
    const hasMore = taskMastersSnapshot.docs.length === limit;
    const nextCursor = hasMore && lastDoc ? { startAfterDocId: lastDoc.id } : null;

    return NextResponse.json({ taskMasters, hasMore, nextCursor });
  } catch (error) {
    console.error('Error fetching all task masters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task masters' },
      { status: 500 }
    );
  }
}

