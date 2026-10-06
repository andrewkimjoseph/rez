import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { paxDB } from '@/firebase/serverConfig';
import { FieldValue } from 'firebase-admin/firestore';
import {
  findLeadsForConversion,
  parseOptionalLeadEmail,
  updateBrevoContactAttributes,
} from '@/lib/taskmaster-leads';

/**
 * Automation P2 - PREMIUM ENTRY CONVERSION
 *
 * Updates TaskMasterLead in Brevo when they create a Rez account.
 * For leads with leadSource === "Premium CTA", sets CUSTOMER_LEVEL to "Trial".
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

    const leadEmail = await parseOptionalLeadEmail(request);

    const leadsRef = paxDB.collection('taskmaster_leads');
    const matchingLeads = await findLeadsForConversion(leadsRef, userEmail, leadEmail);

    if (matchingLeads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No TaskMasterLead found for this email',
        action: 'none',
      });
    }

    const premiumLeads = matchingLeads.filter(
      (doc) => doc.data().leadSource === 'Premium CTA'
    );

    if (premiumLeads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Lead is not from Premium CTA',
        action: 'none',
      });
    }

    if (!process.env.BREVO_API_KEY) {
      console.error('BREVO_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'CRM service is not configured' },
        { status: 500 }
      );
    }

    await updateBrevoContactAttributes(
      [userEmail, leadEmail ?? ''],
      { CUSTOMER_LEVEL: 'Trial' }
    );

    await Promise.all(
      premiumLeads.map((leadDoc) =>
        leadsRef.doc(leadDoc.id).update({
          customerLevel: 'Trial',
          lastActivityDate: FieldValue.serverTimestamp(),
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: 'Lead updated to Trial level',
      action: 'updated',
      updatedLeads: premiumLeads.length,
    });
  } catch (error) {
    console.error('Error in fireTriggerForAutomationP2:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}
