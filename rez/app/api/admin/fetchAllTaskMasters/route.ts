import { NextRequest, NextResponse } from 'next/server';
import { rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';
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

    // Fetch all task masters from Rez Firestore
    const taskMastersRef = rezDB().collection(COLLECTIONS.TASK_MASTERS);
    const taskMastersSnapshot = await taskMastersRef.orderBy('timeCreated', 'desc').get();

    // Get Firebase Auth instance
    const auth = getAuth(getApp('rezApp'));

    // Fetch disabled status from Firebase Auth for each task master
    const taskMasters = await Promise.all(
      taskMastersSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        let disabled = false;
        
        try {
          const userRecord = await auth.getUser(doc.id);
          disabled = userRecord.disabled;
        } catch {
          // User might not exist in Auth, default to not disabled
          disabled = false;
        }
        
        return {
          id: doc.id,
          ...data,
          disabled
        };
      })
    );

    return NextResponse.json({ taskMasters });
  } catch (error) {
    console.error('Error fetching all task masters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task masters' },
      { status: 500 }
    );
  }
}

