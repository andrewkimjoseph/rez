import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';
import { requireSuperAdmin } from '@/lib/api-auth';
import { getAlgoliaClient, isAlgoliaConfigured } from '@/lib/algolia-server';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const ALGOLIA_LIST_PREFIX = 'algolia:list:';
const ALGOLIA_SEARCH_PREFIX = 'algolia:search:';

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
    const paxAuth = getAuth(getApp('paxApp'));

    if (isAlgoliaConfigured()) {
      try {
        const client = getAlgoliaClient();
        let hits: Record<string, unknown>[] = [];
        let nextCursor: { startAfterDocId: string } | null = null;
        let hasMore = false;

        if (search && search.length > 0) {
          const page =
            startAfterDocId?.startsWith(ALGOLIA_SEARCH_PREFIX) ?
              Math.max(0, parseInt(startAfterDocId.slice(ALGOLIA_SEARCH_PREFIX.length), 10) || 0)
            : 0;
          const response = await client.searchSingleIndex({
            indexName: COLLECTIONS.PARTICIPANTS,
            searchParams: {
              query: search,
              hitsPerPage: limit,
              page,
            },
          });
          hits = (response.hits ?? []) as Record<string, unknown>[];
          const nbPages = response.nbPages ?? 0;
          hasMore = page + 1 < nbPages;
          nextCursor = hasMore ? { startAfterDocId: `${ALGOLIA_SEARCH_PREFIX}${page + 1}` } : null;
        } else {
          const page = startAfterDocId?.startsWith(ALGOLIA_LIST_PREFIX)
            ? Math.max(0, parseInt(startAfterDocId.slice(ALGOLIA_LIST_PREFIX.length), 10) || 0)
            : 0;
          const response = await client.searchSingleIndex({
            indexName: COLLECTIONS.PARTICIPANTS,
            searchParams: {
              query: '',
              hitsPerPage: limit,
              page,
            },
          });
          hits = (response.hits ?? []) as Record<string, unknown>[];
          const nbPages = response.nbPages ?? 0;
          hasMore = page + 1 < nbPages;
          nextCursor = hasMore ? { startAfterDocId: `${ALGOLIA_LIST_PREFIX}${page + 1}` } : null;
        }

        const participantIds = hits.map((h) => (h.objectID ?? h.id) as string).filter(Boolean);
        let disabledSet = new Set<string>();
        if (participantIds.length > 0) {
          try {
            const getUsersResult = await paxAuth.getUsers(participantIds.map((id) => ({ uid: id })));
            getUsersResult.users.forEach((u) => {
              if (u.disabled) disabledSet.add(u.uid);
            });
          } catch {
            // leave disabledSet empty
          }
        }

        const participants = hits.map((hit) => {
          const id = (hit.objectID ?? hit.id) as string;
          return {
            id,
            emailAddress: hit.emailAddress ?? null,
            displayName: hit.displayName ?? null,
            disabled: disabledSet.has(id),
          };
        });

        return NextResponse.json({ participants, hasMore, nextCursor });
      } catch (algoliaError) {
        console.warn('Algolia participants fetch failed, falling back to Firestore:', algoliaError);
      }
    }

    const participantsRef = paxDB.collection(COLLECTIONS.PARTICIPANTS);
    let snapshot;

    if (search && search.length > 0) {
      const searchEnd = search + '\uf8ff';
      let query = participantsRef
        .where('emailAddress', '>=', search)
        .where('emailAddress', '<=', searchEnd)
        .orderBy('emailAddress')
        .limit(limit);

      if (startAfterDocId && !startAfterDocId.startsWith('algolia:')) {
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

      if (startAfterDocId && !startAfterDocId.startsWith('algolia:')) {
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
