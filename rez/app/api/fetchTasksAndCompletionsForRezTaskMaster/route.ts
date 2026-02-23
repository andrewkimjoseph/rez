import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireAuth } from '@/lib/api-auth';
import { getAlgoliaClient, isAlgoliaConfigured } from '@/lib/algolia-server';

function escapeAlgoliaFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Fetches all tasks and their completions for the authenticated Rez task master.
 * Tasks are read from Algolia when configured; completions stay on Firestore.
 */
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

    let tasks: unknown[] = [];
    const taskIds: string[] = [];

    if (isAlgoliaConfigured()) {
      try {
        const client = getAlgoliaClient();
        const filter = `rezTaskMasterEmailAddress:"${escapeAlgoliaFilterValue(authResult.email)}"`;
        const response = await client.searchSingleIndex({
          indexName: COLLECTIONS.TASKS,
          searchParams: { query: '', filters: filter, hitsPerPage: 1000 },
        });
        const hits = response.hits ?? [];
        tasks = hits.map((hit: Record<string, unknown>) => {
          const { objectID, ...rest } = hit;
          return { id: objectID ?? null, ...rest };
        });
        taskIds.push(...(tasks as { id: string }[]).map((t) => t.id).filter(Boolean));
      } catch (algoliaError) {
        console.warn('Algolia fetch failed, falling back to Firestore for tasks:', algoliaError);
      }
    }

    if (tasks.length === 0) {
      const tasksRef = paxDB.collection(COLLECTIONS.TASKS);
      const tasksSnapshot = await tasksRef
        .where('rezTaskMasterEmailAddress', '==', authResult.email)
        .get();
      tasksSnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() });
        taskIds.push(doc.id);
      });
    } else if (taskIds.length === 0) {
      taskIds.push(...(tasks as { id: string }[]).map((t) => t.id).filter(Boolean));
    }

    if (taskIds.length === 0) {
      return NextResponse.json({ tasks, taskCompletions: [] });
    }

    const taskCompletionsRef = paxDB.collection(COLLECTIONS.TASK_COMPLETIONS);
    const taskCompletions: unknown[] = [];
    const chunkSize = 30;
    for (let i = 0; i < taskIds.length; i += chunkSize) {
      const chunk = taskIds.slice(i, i + chunkSize);
      const taskCompletionsSnapshot = await taskCompletionsRef
        .where('taskId', 'in', chunk)
        .get();
      taskCompletionsSnapshot.forEach((doc) => {
        taskCompletions.push({ id: doc.id, ...doc.data() });
      });
    }

    return NextResponse.json({ tasks, taskCompletions });
  } catch (error) {
    console.error('Error fetching tasks and completions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks and completions' },
      { status: 500 }
    );
  }
}

