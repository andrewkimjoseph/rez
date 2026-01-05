import { NextRequest, NextResponse } from 'next/server';
import { rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskMasterId, disabled, adminId } = body as {
      taskMasterId: string;
      disabled: boolean;
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

    if (typeof disabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Disabled status must be a boolean' },
        { status: 400 }
      );
    }

    // Verify the user is a super admin
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

    // Get the task master to check if they're a super admin
    const taskMasterRef = rezDB.collection(COLLECTIONS.TASK_MASTERS).doc(taskMasterId);
    const taskMasterDoc = await taskMasterRef.get();

    if (!taskMasterDoc.exists) {
      return NextResponse.json(
        { error: 'Task Master not found' },
        { status: 404 }
      );
    }

    const taskMasterData = taskMasterDoc.data();

    // Prevent disabling super admins
    if (taskMasterData?.isSuperAdmin === true && disabled === true) {
      return NextResponse.json(
        { error: 'Cannot disable a super admin' },
        { status: 400 }
      );
    }

    // Update the user's disabled status in Firebase Auth
    const auth = getAuth(getApp('rezApp'));
    await auth.updateUser(taskMasterId, {
      disabled: disabled
    });

    return NextResponse.json({
      success: true,
      message: `Task Master ${disabled ? 'disabled' : 'enabled'} successfully`
    });
  } catch (error) {
    console.error('Error toggling task master status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle task master status' },
      { status: 500 }
    );
  }
}

