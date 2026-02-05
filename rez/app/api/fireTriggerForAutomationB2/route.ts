import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { paxDB } from '@/firebase/serverConfig';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Automation B2 - PLAYBOOK ENTRY CONVERSION
 * 
 * Updates TaskMasterLead in Brevo when they create a Rez account.
 * For leads with leadSource === "Playbook", sets PLAYBOOK_STAGE to "Account Created".
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Query taskmaster_leads by email
 * 3. Check if leadSource is "Playbook"
 * 4. If yes, update Brevo contact with PLAYBOOK_STAGE = "Account Created"
 * 5. Update Firestore document with playbookStage = "Account Created"
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Get user's email
    const userEmail = authResult.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found in authentication token' },
        { status: 400 }
      );
    }

    // Query taskmaster_leads by email
    const leadsRef = paxDB.collection('taskmaster_leads');
    const snapshot = await leadsRef
      .where('leadEmailAddress', '==', userEmail)
      .get();

    if (snapshot.empty) {
      // No lead found - this is not an error, just no action needed
      return NextResponse.json({
        success: true,
        message: 'No TaskMasterLead found for this email',
        action: 'none',
      });
    }

    // Check if any lead has "Playbook" as leadSource
    const playbookLeads = snapshot.docs.filter(
      (doc) => doc.data().leadSource === 'Playbook'
    );

    if (playbookLeads.length === 0) {
      // Lead exists but is not from Playbook
      return NextResponse.json({
        success: true,
        message: 'Lead is not from Playbook',
        action: 'none',
      });
    }

    // Get Brevo API key
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      console.error('BREVO_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'CRM service is not configured' },
        { status: 500 }
      );
    }

    // Update contact in Brevo
    const brevoResponse = await fetch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(userEmail)}`,
      {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'api-key': brevoApiKey,
        },
        body: JSON.stringify({
          attributes: {
            PLAYBOOK_STAGE: 'Account Created',
          },
        }),
      }
    );

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.json().catch(() => ({}));
      console.error('Brevo API error:', {
        status: brevoResponse.status,
        error: errorData,
        email: userEmail,
      });
      
      // Don't fail the request, continue to update Firestore
      console.warn('Continuing to update Firestore despite Brevo error');
    }

    // Update all matching Playbook leads in Firestore
    const updatePromises = playbookLeads.map((leadDoc) =>
      leadsRef.doc(leadDoc.id).update({
        playbookStage: 'Account Created',
        lastActivityDate: FieldValue.serverTimestamp(),
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: 'Lead updated with playbookStage: Account Created',
      action: 'updated',
      updatedLeads: playbookLeads.length,
    });
  } catch (error) {
    console.error('Error in fireTriggerForAutomationB2:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}
