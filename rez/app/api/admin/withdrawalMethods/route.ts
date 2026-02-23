import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireSuperAdmin } from '@/lib/api-auth';
import { getAlgoliaClient, isAlgoliaConfigured } from '@/lib/algolia-server';
import { getWhitelistedRoot, isWhitelisted } from '@/lib/checkWalletVerification';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const ALGOLIA_PAGE_PREFIX = 'algolia:page:';
const ALGOLIA_INDEX_WITHDRAWAL_METHODS = 'withdrawal_methods';
const MAX_PARTICIPANT_IDS_FOR_SEARCH = 50;

function escapeAlgoliaFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

async function enrichWithParticipantEmails(
  hits: Record<string, unknown>[],
  participantsRef: ReturnType<typeof paxDB.collection>
): Promise<Map<string, string | null>> {
  const ids = [...new Set(hits.map((h) => (h.participantId as string) ?? '').filter(Boolean))];
  const map = new Map<string, string | null>();
  if (ids.length === 0) return map;
  const BATCH = 10;
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const snaps = await paxDB.getAll(...batch.map((id) => participantsRef.doc(id)));
    snaps.forEach((snap, idx) => {
      const pid = batch[idx];
      if (snap.exists && pid) {
        const email = snap.data()?.emailAddress ?? null;
        map.set(pid, typeof email === 'string' ? email : null);
      }
    });
  }
  return map;
}

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

    if (isAlgoliaConfigured()) {
      try {
        const client = getAlgoliaClient();
        const page = startAfterDocId?.startsWith(ALGOLIA_PAGE_PREFIX)
          ? Math.max(0, parseInt(startAfterDocId.slice(ALGOLIA_PAGE_PREFIX.length), 10) || 0)
          : 0;

        let filters: string | undefined;
        if (search && search.length > 0) {
          const participantsResponse = await client.searchSingleIndex({
            indexName: COLLECTIONS.PARTICIPANTS,
            searchParams: {
              query: search,
              hitsPerPage: MAX_PARTICIPANT_IDS_FOR_SEARCH,
              attributesToRetrieve: ['objectID'],
            },
          });
          let participantIds = (participantsResponse.hits ?? [])
            .map((h: Record<string, unknown>) => (h.objectID ?? h.id) as string)
            .filter(Boolean);
          if (participantIds.length === 0) {
            const participantsSnap = await participantsRef
              .where('emailAddress', '>=', search)
              .where('emailAddress', '<=', search + '\uf8ff')
              .limit(MAX_PARTICIPANT_IDS_FOR_SEARCH)
              .get();
            participantIds = participantsSnap.docs.map((d) => d.id);
          }
          if (participantIds.length === 0) {
            return NextResponse.json({ withdrawalMethods: [], hasMore: false, nextCursor: null });
          }
          filters = participantIds
            .map((id) => `participantId:"${escapeAlgoliaFilterValue(id)}"`)
            .join(' OR ');
        }

        const response = await client.searchSingleIndex({
          indexName: ALGOLIA_INDEX_WITHDRAWAL_METHODS,
          searchParams: {
            query: '',
            ...(filters && { filters }),
            hitsPerPage: limit,
            page,
          },
        });
        const hits = (response.hits ?? []) as Record<string, unknown>[];
        const verifiedHits: Record<string, unknown>[] = [];
        for (const hit of hits) {
          const walletAddress = (hit.walletAddress ?? hit.address ?? hit.wallet) as string | undefined;
          if (typeof walletAddress !== 'string' || !walletAddress.trim()) continue;
          const root = await getWhitelistedRoot(walletAddress);
          if (!isWhitelisted(root)) continue;
          verifiedHits.push(hit);
        }

        const emailByParticipantId = await enrichWithParticipantEmails(verifiedHits, participantsRef);

        const withdrawalMethods = verifiedHits.map((hit) => {
          const id = (hit.objectID ?? hit.id) as string;
          const participantId = (hit.participantId as string) ?? null;
          const walletAddress = (hit.walletAddress ?? hit.address ?? hit.wallet) as string | undefined;
          return {
            id,
            participantId,
            participantEmail: participantId ? emailByParticipantId.get(participantId) ?? null : null,
            walletAddress: typeof walletAddress === 'string' ? walletAddress : null,
            timeCreated: hit.timeCreated ?? null,
            ...hit,
          };
        });

        const nbPages = response.nbPages ?? 0;
        const hasMore = page + 1 < nbPages;
        const nextCursor = hasMore ? { startAfterDocId: `${ALGOLIA_PAGE_PREFIX}${page + 1}` } : null;
        return NextResponse.json({ withdrawalMethods, hasMore, nextCursor });
      } catch (algoliaError) {
        console.warn('Algolia withdrawal methods fetch failed, falling back to Firestore:', algoliaError);
      }
    }

    const methodsRef = paxDB.collection(COLLECTIONS.PAYMENT_METHODS);
    let query = methodsRef.orderBy('timeCreated', 'desc').limit(limit);

    if (search && search.length > 0) {
      const participantsSnap = await participantsRef
        .where('emailAddress', '>=', search)
        .where('emailAddress', '<=', search + '\uf8ff')
        .limit(MAX_PARTICIPANT_IDS_FOR_SEARCH)
        .get();
      const participantIds = participantsSnap.docs.map((d) => d.id);
      if (participantIds.length === 0) {
        return NextResponse.json({ withdrawalMethods: [], hasMore: false, nextCursor: null });
      }
      if (participantIds.length === 1) {
        query = methodsRef
          .where('participantId', '==', participantIds[0])
          .orderBy('timeCreated', 'desc')
          .limit(limit);
      } else {
        query = methodsRef
          .where('participantId', 'in', participantIds.slice(0, 30))
          .orderBy('timeCreated', 'desc')
          .limit(limit);
      }
    }

    if (startAfterDocId && !startAfterDocId.startsWith(ALGOLIA_PAGE_PREFIX)) {
      const lastDoc = await methodsRef.doc(startAfterDocId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();
    const uniqueParticipantIds = [
      ...new Set(snapshot.docs.map((d) => (d.data().participantId as string) ?? '').filter(Boolean)),
    ];
    const emailByParticipantId = new Map<string, string | null>();
    const BATCH = 10;
    for (let i = 0; i < uniqueParticipantIds.length; i += BATCH) {
      const batch = uniqueParticipantIds.slice(i, i + BATCH);
      const refs = batch.map((id) => participantsRef.doc(id));
      const snaps = await paxDB.getAll(...refs);
      snaps.forEach((snap, idx) => {
        const pid = batch[idx];
        if (snap.exists && pid) {
          const email = snap.data()?.emailAddress ?? null;
          emailByParticipantId.set(pid, typeof email === 'string' ? email : null);
        }
      });
    }

    const rawMethods = snapshot.docs.map((doc) => {
      const data = doc.data();
      const participantId = (data.participantId as string) ?? null;
      const walletAddress = (data.walletAddress ?? data.address ?? data.wallet) as string | undefined;
      return {
        id: doc.id,
        participantId,
        participantEmail: participantId ? emailByParticipantId.get(participantId) ?? null : null,
        walletAddress: typeof walletAddress === 'string' ? walletAddress : null,
        timeCreated: data.timeCreated ?? null,
        ...data,
      };
    });

    const withdrawalMethods: typeof rawMethods = [];
    for (const m of rawMethods) {
      if (!m.walletAddress) continue;
      const root = await getWhitelistedRoot(m.walletAddress);
      if (isWhitelisted(root)) withdrawalMethods.push(m);
    }

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const hasMore = snapshot.docs.length === limit;
    const nextCursor = hasMore && lastDoc ? { startAfterDocId: lastDoc.id } : null;

    return NextResponse.json({ withdrawalMethods, hasMore, nextCursor });
  } catch (error) {
    console.error('Error fetching withdrawal methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal methods' },
      { status: 500 }
    );
  }
}
