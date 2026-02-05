import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { requireSuperAdmin } from '@/lib/api-auth';

// Cloudflare Pages requires edge; enable nodejs_compat in CF dashboard for Firebase Admin
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and super admin status
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Fetch all tasks
    const tasksRef = paxDB().collection(COLLECTIONS.TASKS);
    const tasksSnapshot = await tasksRef.orderBy('timeCreated', 'desc').get();

    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching all tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

