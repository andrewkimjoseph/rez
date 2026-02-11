import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
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
    const search = searchParams.get('search')?.trim() || undefined;

    const participantsRef = paxDB.collection(COLLECTIONS.PARTICIPANTS);
    const paxAuth = getAuth(getApp('paxApp'));

    let snapshot;

    if (search && search.length > 0) {
      const searchEnd = search + '\uf8ff';
      let query = participantsRef
        .where('emailAddress', '>=', search)
        .where('emailAddress', '<=', searchEnd)
        .orderBy('emailAddress')
        .limit(limit);

      if (startAfterDocId) {
        const lastDoc = await participantsRef.doc(startAfterDocId).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }

      snapshot = await query.get();
    } else {
      let query = participantsRef
        .orderBy('timeCreated', 'desc')
        .limit(limit);

      if (startAfterDocId) {
        const lastDoc = await participantsRef.doc(startAfterDocId).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }

      snapshot = await query.get();
    }

    const participants = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let disabled = false;

        try {
          const userRecord = await paxAuth.getUser(doc.id);
          disabled = userRecord.disabled;
        } catch {
          disabled = false;
        }

        return {
          id: doc.id,
          emailAddress: data?.emailAddress ?? null,
          displayName: data?.displayName ?? null,
          disabled,
        };
      })
    );

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const hasMore = snapshot.docs.length === limit;
    const nextCursor = hasMore && lastDoc ? { startAfterDocId: lastDoc.id } : null;

    return NextResponse.json({ participants, hasMore, nextCursor });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}
