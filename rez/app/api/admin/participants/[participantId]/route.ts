import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { getAuth } from 'firebase-admin/auth';
import { getApp } from 'firebase-admin/app';
import { requireSuperAdmin } from '@/lib/api-auth';
import { FieldValue } from 'firebase-admin/firestore';
import { getWhitelistedRoot, isWhitelisted } from '@/lib/checkWalletVerification';
import { getAlgoliaClient, isAlgoliaConfigured } from '@/lib/algolia-server';

async function fetchParticipantDataForGet(participantId: string): Promise<{
  id: string;
  emailAddress: string | null;
  displayName: string | null;
  country: string | null;
  accountType: string | null;
  timeCreated: unknown;
  timeUpdated: unknown;
} | null> {
  if (isAlgoliaConfigured()) {
    try {
      const client = getAlgoliaClient();
      const response = await client.getObjects({
        requests: [{ objectID: participantId, indexName: COLLECTIONS.PARTICIPANTS }],
      });
      const result = response.results?.[0] as Record<string, unknown> | undefined;
      if (result && (result.objectID ?? result.id)) {
        const id = (result.objectID ?? result.id) as string;
        return {
          id,
          emailAddress: (result.emailAddress as string) ?? null,
          displayName: (result.displayName as string) ?? null,
          country: (result.country as string) ?? null,
          accountType: (result.accountType as string) ?? null,
          timeCreated: result.timeCreated ?? null,
          timeUpdated: result.timeUpdated ?? null,
        };
      }
    } catch (algoliaError) {
      console.warn('Algolia participant fetch failed, falling back to Firestore:', algoliaError);
    }
  }

  const participantsRef = paxDB.collection(COLLECTIONS.PARTICIPANTS);
  const participantDoc = await participantsRef.doc(participantId).get();
  if (!participantDoc.exists) return null;
  const data = participantDoc.data();
  return {
    id: participantDoc.id,
    emailAddress: data?.emailAddress ?? null,
    displayName: data?.displayName ?? null,
    country: data?.country ?? null,
    accountType: data?.accountType ?? null,
    timeCreated: data?.timeCreated ?? null,
    timeUpdated: data?.timeUpdated ?? null,
  };
}

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

    const participantData = await fetchParticipantDataForGet(participantId);

    if (!participantData) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

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
      id: participantData.id,
      emailAddress: participantData.emailAddress,
      displayName: participantData.displayName,
      country: participantData.country,
      accountType: participantData.accountType,
      disabled,
      timeCreated: participantData.timeCreated,
      timeUpdated: participantData.timeUpdated,
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

    const participantExists = await fetchParticipantDataForGet(participantId);
    if (!participantExists) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    const participantsRef = paxDB.collection(COLLECTIONS.PARTICIPANTS);

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
