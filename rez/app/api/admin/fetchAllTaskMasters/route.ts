import { NextRequest, NextResponse } from 'next/server';
import { rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    // Verify the user is a super admin by document ID (task masters are in Rez Firestore)
    const adminDocRef = rezDB.collection(COLLECTIONS.TASK_MASTERS).doc(adminId);
    const adminDoc = await adminDocRef.get();

    if (!adminDoc.exists) {
      return NextResponse.json(
        { error: 'Unauthorized: User not found' },
        { status: 403 }
      );
    }

    const adminData = adminDoc.data();
    if (adminData?.isSuperAdmin !== true) {
      return NextResponse.json(
        { error: 'Unauthorized: Not a super admin' },
        { status: 403 }
      );
    }

    // Fetch all task masters from Rez Firestore
    const taskMastersRef = rezDB.collection(COLLECTIONS.TASK_MASTERS);
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

