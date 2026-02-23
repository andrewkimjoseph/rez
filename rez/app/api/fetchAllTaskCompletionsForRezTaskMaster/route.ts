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

    let taskIds: string[] = [];

    if (isAlgoliaConfigured()) {
      try {
        const client = getAlgoliaClient();
        const filter = `rezTaskMasterEmailAddress:"${escapeAlgoliaFilterValue(authResult.email)}"`;
        const response = await client.searchSingleIndex({
          indexName: COLLECTIONS.TASKS,
          searchParams: { query: '', filters: filter, hitsPerPage: 1000 },
        });
        taskIds = (response.hits ?? [])
          .map((h: Record<string, unknown>) => (h.objectID ?? h.id) as string)
          .filter(Boolean);
      } catch (algoliaError) {
        console.warn('Algolia fetch tasks for task master failed, falling back to Firestore:', algoliaError);
      }
    }

    if (taskIds.length === 0) {
      const tasksRef = paxDB.collection(COLLECTIONS.TASKS);
      const tasksSnapshot = await tasksRef
        .where('rezTaskMasterEmailAddress', '==', authResult.email)
        .get();
      tasksSnapshot.forEach((doc) => taskIds.push(doc.id));
    }

    if (taskIds.length === 0) {
      return NextResponse.json({ taskCompletions: [] });
    }

    const taskCompletionsRef = paxDB.collection(COLLECTIONS.TASK_COMPLETIONS);
    const taskCompletions: unknown[] = [];
    const chunkSize = 30;
    for (let i = 0; i < taskIds.length; i += chunkSize) {
      const chunk = taskIds.slice(i, i + chunkSize);
      const snapshot = await taskCompletionsRef.where('taskId', 'in', chunk).get();
      snapshot.forEach((doc) => {
        taskCompletions.push({ id: doc.id, ...doc.data() });
      });
    }

    return NextResponse.json({ taskCompletions });
  } catch (error) {
    console.error('Error fetching task completions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task completions' },
      { status: 500 }
    );
  }
} 