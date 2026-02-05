import { NextRequest, NextResponse } from 'next/server';
import { rezDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { FieldValue } from 'firebase-admin/firestore';
import { requireSuperAdmin } from '@/lib/api-auth';

// Cloudflare Pages requires edge; enable nodejs_compat in CF dashboard for Firebase Admin
export const runtime = 'edge';

export interface AdminUpdateTaskMasterData {
  name?: string;
  emailAddress?: string;
  organizationId?: string;
  isSuperAdmin?: boolean;
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication and super admin status
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { taskMasterId, data } = body as {
      taskMasterId: string;
      data: AdminUpdateTaskMasterData;
    };

    if (!taskMasterId) {
      return NextResponse.json(
        { error: 'Task Master ID is required' },
        { status: 400 }
      );
    }

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No data provided for update' },
        { status: 400 }
      );
    }

    // Verify task master exists (in Rez Firestore)
    const taskMasterRef = rezDB().collection(COLLECTIONS.TASK_MASTERS).doc(taskMasterId);
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

