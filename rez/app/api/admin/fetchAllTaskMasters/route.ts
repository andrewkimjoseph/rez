import { NextRequest, NextResponse } from 'next/server';
import { rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';
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
    const auth = getAuth(getApp('rezApp'));

    if (isAlgoliaConfigured()) {
      try {
        const client = getAlgoliaClient();
        const page = startAfterDocId?.startsWith(ALGOLIA_PAGE_PREFIX)
          ? Math.max(0, parseInt(startAfterDocId.slice(ALGOLIA_PAGE_PREFIX.length), 10) || 0)
          : 0;
        const response = await client.searchSingleIndex({
          indexName: COLLECTIONS.TASK_MASTERS,
          searchParams: {
            query: '',
            hitsPerPage: limit,
            page,
          },
        });
        const hits = (response.hits ?? []) as Record<string, unknown>[];
        const taskMasterIds = hits.map((h) => (h.objectID ?? h.id) as string).filter(Boolean);
        let disabledSet = new Set<string>();
        if (taskMasterIds.length > 0) {
          try {
            const getUsersResult = await auth.getUsers(taskMasterIds.map((id) => ({ uid: id })));
            getUsersResult.users.forEach((u) => {
              if (u.disabled) disabledSet.add(u.uid);
            });
          } catch {
            // leave disabledSet empty
          }
        }
        const taskMasters = hits.map((hit) => {
          const id = (hit.objectID ?? hit.id) as string;
          const { objectID, ...rest } = hit;
          return {
            id,
            ...rest,
            disabled: disabledSet.has(id),
          };
        });
        const nbPages = response.nbPages ?? 0;
        const hasMore = page + 1 < nbPages;
        const nextCursor = hasMore ? { startAfterDocId: `${ALGOLIA_PAGE_PREFIX}${page + 1}` } : null;
        return NextResponse.json({ taskMasters, hasMore, nextCursor });
      } catch (algoliaError) {
        console.warn('Algolia fetch task masters failed, falling back to Firestore:', algoliaError);
      }
    }

    const taskMastersRef = rezDB.collection(COLLECTIONS.TASK_MASTERS);
    let query = taskMastersRef.orderBy('timeCreated', 'desc').limit(limit);

    if (startAfterDocId && !startAfterDocId.startsWith(ALGOLIA_PAGE_PREFIX)) {
      const lastDoc = await taskMastersRef.doc(startAfterDocId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const taskMastersSnapshot = await query.get();

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

