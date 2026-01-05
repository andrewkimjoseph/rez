import { NextRequest, NextResponse } from 'next/server';
import { rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { FieldValue } from 'firebase-admin/firestore';

export interface AdminUpdateTaskMasterData {
  name?: string;
  emailAddress?: string;
  organizationId?: string;
  isSuperAdmin?: boolean;
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskMasterId, data, adminId } = body as {
      taskMasterId: string;
      data: AdminUpdateTaskMasterData;
      adminId: string;
    };

    if (!taskMasterId) {
      return NextResponse.json(
        { error: 'Task Master ID is required' },
        { status: 400 }
      );
    }

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No data provided for update' },
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

    // Verify task master exists (in Rez Firestore)
    const taskMasterRef = rezDB.collection(COLLECTIONS.TASK_MASTERS).doc(taskMasterId);
    const taskMasterDoc = await taskMasterRef.get();

    if (!taskMasterDoc.exists) {
      return NextResponse.json(
        { error: 'Task Master not found' },
        { status: 404 }
      );
    }

    // Filter out undefined values
    const updateData: Record<string, unknown> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the task master
    await taskMasterRef.update({
      ...updateData,
      timeUpdated: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Task Master updated successfully'
    });
  } catch (error) {
    console.error('Error updating task master:', error);
    return NextResponse.json(
      { error: 'Failed to update task master' },
      { status: 500 }
    );
  }
}

