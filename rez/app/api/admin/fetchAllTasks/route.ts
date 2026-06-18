import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireSuperAdmin } from '@/lib/api-auth';
import { getAlgoliaClient, isAlgoliaConfigured } from '@/lib/algolia-server';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const ALGOLIA_PAGE_PREFIX = 'algolia:page:';

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
    const preferFirestore = searchParams.get('source') === 'firestore';

    if (isAlgoliaConfigured() && !preferFirestore) {
      try {
        const client = getAlgoliaClient();
        const page = startAfterDocId?.startsWith(ALGOLIA_PAGE_PREFIX)
          ? Math.max(0, parseInt(startAfterDocId.slice(ALGOLIA_PAGE_PREFIX.length), 10) || 0)
          : 0;
        const response = await client.searchSingleIndex({
          indexName: COLLECTIONS.TASKS,
          searchParams: {
            query: '',
            hitsPerPage: limit,
            page,
          },
        });
        const tasks = (response.hits ?? []).map((hit: Record<string, unknown>) => {
          const { objectID, ...rest } = hit;
          return { id: objectID ?? null, ...rest };
        });
        const nbPages = response.nbPages ?? 0;
        const hasMore = page + 1 < nbPages;
        const nextCursor = hasMore ? { startAfterDocId: `${ALGOLIA_PAGE_PREFIX}${page + 1}` } : null;
        return NextResponse.json({ tasks, hasMore, nextCursor });
      } catch (algoliaError) {
        console.warn('Algolia fetch failed, falling back to Firestore:', algoliaError);
      }
    }

    const tasksRef = paxDB.collection(COLLECTIONS.TASKS);
    let query = tasksRef.orderBy('timeCreated', 'desc').limit(limit);

    if (startAfterDocId && !startAfterDocId.startsWith(ALGOLIA_PAGE_PREFIX)) {
      const lastDoc = await tasksRef.doc(startAfterDocId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const tasksSnapshot = await query.get();
    const tasks = tasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lastDoc = tasksSnapshot.docs[tasksSnapshot.docs.length - 1];
    const hasMore = tasksSnapshot.docs.length === limit;
    const nextCursor = hasMore && lastDoc ? { startAfterDocId: lastDoc.id } : null;

    return NextResponse.json({ tasks, hasMore, nextCursor });
  } catch (error) {
    console.error('Error fetching all tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
