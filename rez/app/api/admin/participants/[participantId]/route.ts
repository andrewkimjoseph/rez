import { NextRequest, NextResponse } from 'next/server';
import { paxDB } from '@/firebase/serverConfig';
import { COLLECTIONS } from '@/firebase/firestore/constants/collections';
import { FieldValue, getApp, getAuth } from '@/firebase/admin';
import { requireSuperAdmin } from '@/lib/api-auth';
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
    const paymentMethods: Array<{
      id: string;
      name: string | null;
      walletAddress: string | null;
      predefinedId: number | null;
      verified: boolean;
    }> = [];
    try {
      const paymentMethodsRef = paxDB.collection(COLLECTIONS.PAYMENT_METHODS);
      const paymentSnap = await paymentMethodsRef
        .where('participantId', '==', participantId)
        .get();

      const normalizeAddress = (value: unknown): string | null => {
        if (typeof value !== 'string' || !value.trim()) return null;
        const trimmed = value.trim();
        return trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
      };

      const rawMethods = paymentSnap.docs.map((doc) => {
        const d = doc.data();
        const name = typeof d?.name === 'string' && d.name.trim() ? d.name.trim() : null;
        const predefinedId =
          typeof d?.predefinedId === 'number' && Number.isFinite(d.predefinedId)
            ? d.predefinedId
            : null;
        return {
          id: (typeof d?.id === 'string' && d.id) || doc.id,
          name,
          walletAddress: normalizeAddress(d?.walletAddress ?? d?.address ?? d?.wallet),
          predefinedId,
        };
      });

      const uniqueAddresses = [
        ...new Set(rawMethods.map((m) => m.walletAddress).filter((a): a is string => !!a)),
      ];
      const verifiedSet = new Set<string>();
      for (const address of uniqueAddresses) {
        const root = await getWhitelistedRoot(address);
        if (isWhitelisted(root)) {
          verifiedSet.add(address.toLowerCase());
          verifiedWalletAddresses.push(address);
        }
      }

      paymentMethods.push(
        ...rawMethods
          .map((m) => ({
            ...m,
            verified: m.walletAddress ? verifiedSet.has(m.walletAddress.toLowerCase()) : false,
          }))
          .sort((a, b) => {
            const ai = a.predefinedId ?? Number.MAX_SAFE_INTEGER;
            const bi = b.predefinedId ?? Number.MAX_SAFE_INTEGER;
            return ai - bi;
          })
      );
    } catch (err) {
      console.warn('Failed to fetch payment methods for participant:', err);
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
      paymentMethods,
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
