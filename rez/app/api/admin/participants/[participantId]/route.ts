import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';
import { requireSuperAdmin } from '@/lib/api-auth';
import { FieldValue } from 'firebase-admin/firestore';
import { getWhitelistedRoot, isWhitelisted } from '@/lib/checkWalletVerification';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { participantId } = await params;

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }

    const participantsRef = paxDB.collection(COLLECTIONS.PARTICIPANTS);
    const participantDoc = await participantsRef.doc(participantId).get();

    if (!participantDoc.exists) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    const data = participantDoc.data();
    const paxAuth = getAuth(getApp('paxApp'));
    
    let disabled = false;
    try {
      const userRecord = await paxAuth.getUser(participantId);
      disabled = userRecord.disabled;
    } catch {
      disabled = false;
    }

    const verifiedWalletAddresses: string[] = [];
    try {
      const paymentMethodsRef = paxDB.collection(COLLECTIONS.PAYMENT_METHODS);
      const paymentSnap = await paymentMethodsRef
        .where('participantId', '==', participantId)
        .get();
      const addresses = new Set<string>();
      paymentSnap.docs.forEach((doc) => {
        const d = doc.data();
        const addr = (d?.walletAddress ?? d?.address ?? d?.wallet) as string | undefined;
        if (typeof addr === 'string' && addr.trim()) {
          addresses.add(addr.trim());
        }
      });
      for (const address of addresses) {
        const root = await getWhitelistedRoot(address);
        if (isWhitelisted(root)) {
          verifiedWalletAddresses.push(address.startsWith('0x') ? address : `0x${address}`);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch verified wallets for participant:', err);
    }

    return NextResponse.json({
      id: participantDoc.id,
      emailAddress: data?.emailAddress ?? null,
      displayName: data?.displayName ?? null,
      country: data?.country ?? null,
      accountType: data?.accountType ?? null,
      disabled,
      timeCreated: data?.timeCreated ?? null,
      timeUpdated: data?.timeUpdated ?? null,
      verifiedWalletAddresses,
    });
  } catch (error) {
    console.error('Error fetching participant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participant' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { participantId } = await params;

    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { emailAddress, displayName, country } = body as {
      emailAddress?: string;
      displayName?: string;
      country?: string;
    };

    const participantsRef = paxDB.collection(COLLECTIONS.PARTICIPANTS);
    const participantDoc = await participantsRef.doc(participantId).get();

    if (!participantDoc.exists) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    
    if (emailAddress !== undefined) {
      updateData.emailAddress = emailAddress || null;
    }
    if (displayName !== undefined) {
      updateData.displayName = displayName || null;
    }
    if (country !== undefined) {
      updateData.country = country || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields provided for update' },
        { status: 400 }
      );
    }

    updateData.timeUpdated = FieldValue.serverTimestamp();

    await participantsRef.doc(participantId).update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Participant updated successfully',
    });
  } catch (error) {
    console.error('Error updating participant:', error);
    return NextResponse.json(
      { error: 'Failed to update participant' },
      { status: 500 }
    );
  }
}
