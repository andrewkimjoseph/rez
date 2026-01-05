import { NextRequest, NextResponse } from 'next/server';
import { paxDB, rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';

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

    // Fetch all tasks
    const tasksRef = paxDB.collection(COLLECTIONS.TASKS);
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

