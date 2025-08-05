import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';

export async function GET(request: NextRequest) {
  try {
    // Get the rezTaskMasterEmailAddress from query parameters
    const { searchParams } = new URL(request.url);
    const rezTaskMasterEmailAddress = searchParams.get('rezTaskMasterEmailAddress');

    if (!rezTaskMasterEmailAddress) {
      return NextResponse.json(
        { error: 'rezTaskMasterEmailAddress is required' },
        { status: 400 }
      );
    }

    // Fetch all tasks for the given rezTaskMasterEmailAddress
    const tasksRef = paxDB.collection('tasks');
    const snapshot = await tasksRef.where('rezTaskMasterEmailAddress', '==', rezTaskMasterEmailAddress).get();

    const tasks: any[] = [];
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