import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireSuperAdmin } from '@/lib/api-auth';
import { getAlgoliaClient, isAlgoliaConfigured } from '@/lib/algolia-server';

/**
 * Returns the count of tasks with reviewStatus === 'pending'.
 * Prefers Algolia; if Algolia returns 0 we also check Firestore and return the max
 * so the badge is not undercounted when Algolia is temporarily out of sync.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    let algoliaCount: number | null = null;

    if (isAlgoliaConfigured()) {
      try {
        const client = getAlgoliaClient();
        const response = await client.searchSingleIndex({
          indexName: COLLECTIONS.TASKS,
          searchParams: {
            query: '',
            filters: 'reviewStatus:"pending"',
            hitsPerPage: 0,
          },
        });
        algoliaCount = response.nbHits ?? 0;
      } catch (algoliaError) {
        console.warn('Algolia pending tasks count failed, falling back to Firestore:', algoliaError);
      }
    }

    const tasksRef = paxDB.collection(COLLECTIONS.TASKS);
    const query = tasksRef.where('reviewStatus', '==', 'pending');
    const snapshot = await query.count().get();
    const firestoreCount = snapshot.data().count;

    const count =
      typeof algoliaCount === 'number'
        ? Math.max(algoliaCount, firestoreCount)
        : firestoreCount;

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching pending tasks count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending tasks count' },
      { status: 500 }
    );
  }
}
