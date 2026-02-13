import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';
import { requireSuperAdmin } from '@/lib/api-auth';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { FieldValue } from 'firebase-admin/firestore';

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { participantId, disabled } = body as {
      participantId: string;
      disabled: boolean;
    };

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }

    if (typeof disabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Disabled status must be a boolean' },
        { status: 400 }
      );
    }

    const auth = getAuth(getApp('paxApp'));
    
    // Update Firebase Auth
    await auth.updateUser(participantId, {
      disabled,
    });

    // Update Firestore
    const participantsRef = paxDB.collection(COLLECTIONS.PARTICIPANTS);
    const participantDoc = await participantsRef.doc(participantId).get();
    
    if (participantDoc.exists) {
      await participantsRef.doc(participantId).update({
        isDisabled: disabled,
        timeUpdated: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Participant ${disabled ? 'disabled' : 'enabled'} successfully`,
    });
  } catch (error) {
    console.error('Error toggling participant status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle participant status' },
      { status: 500 }
    );
  }
}
