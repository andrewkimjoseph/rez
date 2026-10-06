import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { paxDB } from '@/firebase/serverConfig';
import { FieldValue, type QueryDocumentSnapshot } from 'firebase-admin/firestore';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Updates the Brevo contact (identified by leadEmail) with the signed-in user's email.
 * Called when linking a lead from thecanvassing.xyz to a Rez account.
 * The lead may have used a different email on the form than their Google sign-in email.
 *
 * Also persists rezAccountEmail on the Firestore lead so both addresses stay
 * blocked from re-registering on the marketing site after the Brevo identifier changes.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userEmail = authResult.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found in authentication token' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const leadEmail = typeof body?.leadEmail === 'string' ? body.leadEmail.trim() : null;

    if (!leadEmail) {
      return NextResponse.json(
        { error: 'leadEmail is required' },
        { status: 400 }
      );
    }

    const leadEmailLower = normalizeEmail(leadEmail);
    const userEmailLower = normalizeEmail(userEmail);
    const leadsRef = paxDB.collection('taskmaster_leads');

    const snapshots = await Promise.all([
      leadsRef.where('leadEmailAddress', '==', leadEmail).get(),
      leadsRef.where('leadEmailAddress', '==', leadEmailLower).get(),
      leadsRef.where('leadEmailAddressLower', '==', leadEmailLower).get(),
    ]);

    const leadDocs = new Map<string, QueryDocumentSnapshot>();
    for (const snap of snapshots) {
      for (const doc of snap.docs) {
        leadDocs.set(doc.id, doc);
      }
    }

    if (leadDocs.size > 0) {
      await Promise.all(
        [...leadDocs.values()].map((leadDoc) => {
          const existingLower =
            typeof leadDoc.data().leadEmailAddressLower === 'string'
              ? leadDoc.data().leadEmailAddressLower
              : normalizeEmail(
                  typeof leadDoc.data().leadEmailAddress === 'string'
                    ? leadDoc.data().leadEmailAddress
                    : leadEmail
                );
          return leadsRef.doc(leadDoc.id).update({
            rezAccountEmail: userEmail,
            rezAccountEmailLower: userEmailLower,
            leadEmailAddressLower: existingLower,
            lastActivityDate: FieldValue.serverTimestamp(),
          });
        })
      );
    }

    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      console.error('BREVO_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'CRM service is not configured' },
        { status: 500 }
      );
    }

    const brevoResponse = await fetch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(leadEmail)}`,
      {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'api-key': brevoApiKey,
        },
        body: JSON.stringify({
          attributes: {
            EMAIL: userEmail,
          },
        }),
      }
    );

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.json().catch(() => ({}));
      console.error('Brevo API error:', {
        status: brevoResponse.status,
        error: errorData,
        leadEmail,
        userEmail,
      });
      // Non-blocking: return success so sign-in flow continues
    }

    return NextResponse.json({
      success: true,
      message: 'Brevo contact email updated',
    });
  } catch (error) {
    console.error('Error in updateBrevoLeadEmail:', error);
    return NextResponse.json(
      { error: 'Failed to update Brevo contact' },
      { status: 500 }
    );
  }
}
