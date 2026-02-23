import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireAuth } from '@/lib/api-auth';
import { getAlgoliaClient, isAlgoliaConfigured } from '@/lib/algolia-server';

function escapeAlgoliaFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (!authResult.email) {
      return NextResponse.json(
        { error: 'User email not found in authentication token' },
        { status: 400 }
      );
    }

    if (isAlgoliaConfigured()) {
      try {
        const client = getAlgoliaClient();
        const filter = `rezTaskMasterEmailAddress:"${escapeAlgoliaFilterValue(authResult.email)}"`;
        const response = await client.searchSingleIndex({
          indexName: COLLECTIONS.TASKS,
          searchParams: { query: '', filters: filter, hitsPerPage: 1000 },
        });
        const tasks = (response.hits ?? []).map((hit: Record<string, unknown>) => {
          const { objectID, ...rest } = hit;
          return { id: objectID ?? null, ...rest };
        });
        return NextResponse.json({ tasks });
      } catch (algoliaError) {
        console.warn('Algolia fetch failed, falling back to Firestore:', algoliaError);
      }
    }

    const tasksRef = paxDB.collection(COLLECTIONS.TASKS);
    const snapshot = await tasksRef.where('rezTaskMasterEmailAddress', '==', authResult.email).get();

    const tasks: unknown[] = [];
    snapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
} 