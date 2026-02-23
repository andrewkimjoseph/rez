import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireSuperAdmin } from '@/lib/api-auth';
import { getAlgoliaClient, isAlgoliaConfigured } from '@/lib/algolia-server';

const MAX_ACTIVE_TASKS = 500;

function escapeAlgoliaFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Returns the total count of task completions across active tasks only.
 * Used for the admin dashboard card.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (isAlgoliaConfigured()) {
      try {
        const client = getAlgoliaClient();
        const tasksResponse = await client.searchSingleIndex({
          indexName: COLLECTIONS.TASKS,
          searchParams: {
            query: '',
            filters: 'isAvailable:true',
            hitsPerPage: MAX_ACTIVE_TASKS,
            attributesToRetrieve: ['objectID'],
          },
        });
        const activeTaskIds = (tasksResponse.hits ?? [])
          .map((h: Record<string, unknown>) => (h.objectID ?? h.id) as string)
          .filter(Boolean);

        if (activeTaskIds.length === 0) {
          return NextResponse.json({ count: 0 });
        }

        let totalCount = 0;
        for (const taskId of activeTaskIds) {
          const compResponse = await client.searchSingleIndex({
            indexName: COLLECTIONS.TASK_COMPLETIONS,
            searchParams: {
              query: '',
              filters: `taskId:"${escapeAlgoliaFilterValue(taskId)}"`,
              hitsPerPage: 0,
            },
          });
          totalCount += compResponse.nbHits ?? 0;
        }

        return NextResponse.json({ count: totalCount });
      } catch (algoliaError) {
        console.warn('Algolia active task completions count failed, falling back to Firestore:', algoliaError);
      }
    }

    const tasksRef = paxDB.collection(COLLECTIONS.TASKS);
    const activeTasksSnapshot = await tasksRef
      .where('isAvailable', '==', true)
      .limit(MAX_ACTIVE_TASKS)
      .get();

    const activeTaskIds: string[] = [];
    activeTasksSnapshot.forEach((doc) => {
      activeTaskIds.push(doc.id);
    });

    if (activeTaskIds.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    const completionsRef = paxDB.collection(COLLECTIONS.TASK_COMPLETIONS);
    let totalCount = 0;
    const CHUNK_SIZE = 30;
    for (let i = 0; i < activeTaskIds.length; i += CHUNK_SIZE) {
      const chunk = activeTaskIds.slice(i, i + CHUNK_SIZE);
      const countSnapshot = await completionsRef.where('taskId', 'in', chunk).count().get();
      totalCount += countSnapshot.data().count;
    }

    return NextResponse.json({ count: totalCount });
  } catch (error) {
    console.error('Error fetching active task completions count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active task completions count' },
      { status: 500 }
    );
  }
}
