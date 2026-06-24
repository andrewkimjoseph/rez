import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/api-auth';
import { fetchPollCompletionAnswers } from '@/services/fetchPollCompletionAnswers';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const completionId = searchParams.get('completionId');
    const participantId = searchParams.get('participantId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    if (!completionId && !participantId) {
      return NextResponse.json(
        { error: 'completionId or participantId is required' },
        { status: 400 },
      );
    }

    let result;
    try {
      result = await fetchPollCompletionAnswers(taskId, {
        completionId,
        participantId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch poll answers';
      if (message === 'Task is not a poll') {
        return NextResponse.json({ error: message }, { status: 400 });
      }
      throw error;
    }

    if (!result) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching poll completion answers:', error);
    return NextResponse.json({ error: 'Failed to fetch poll completion answers' }, { status: 500 });
  }
}
