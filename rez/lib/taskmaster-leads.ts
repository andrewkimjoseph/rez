import type { CollectionReference, QueryDocumentSnapshot } from 'firebase-admin/firestore';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function collectEmails(userEmail: string, leadEmail?: string | null): string[] {
  const values = [userEmail, leadEmail]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim());
  return Array.from(new Set(values));
}

/**
 * Finds taskmaster_leads matching the Google/Rez email and/or the original form email.
 */
export async function findLeadsForConversion(
  leadsRef: CollectionReference,
  userEmail: string,
  leadEmail?: string | null
): Promise<QueryDocumentSnapshot[]> {
  const emails = collectEmails(userEmail, leadEmail);
  const lowers = Array.from(new Set(emails.map(normalizeEmail)));

  const snapshots = await Promise.all([
    ...emails.flatMap((value) => [
      leadsRef.where('leadEmailAddress', '==', value).get(),
      leadsRef.where('rezAccountEmail', '==', value).get(),
    ]),
    ...lowers.flatMap((value) => [
      leadsRef.where('leadEmailAddressLower', '==', value).get(),
      leadsRef.where('rezAccountEmailLower', '==', value).get(),
    ]),
  ]);

  const byId = new Map<string, QueryDocumentSnapshot>();
  for (const snap of snapshots) {
    for (const doc of snap.docs) {
      byId.set(doc.id, doc);
    }
  }
  return [...byId.values()];
}

export async function parseOptionalLeadEmail(
  request: Request
): Promise<string | null> {
  try {
    const body = await request.json();
    return typeof body?.leadEmail === 'string' ? body.leadEmail.trim() || null : null;
  } catch {
    return null;
  }
}

/**
 * Updates a Brevo contact, trying the Google email first (after identifier rewrite)
 * and falling back to the original form email if that request fails.
 */
export async function updateBrevoContactAttributes(
  identifiers: string[],
  attributes: Record<string, string>
): Promise<void> {
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) {
    console.error('BREVO_API_KEY environment variable is not set');
    return;
  }

  const unique = Array.from(
    new Set(identifiers.filter((value) => value.trim().length > 0).map((value) => value.trim()))
  );

  for (const identifier of unique) {
    const brevoResponse = await fetch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(identifier)}`,
      {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'api-key': brevoApiKey,
        },
        body: JSON.stringify({ attributes }),
      }
    );

    if (brevoResponse.ok) {
      return;
    }

    const errorData = await brevoResponse.json().catch(() => ({}));
    console.error('Brevo API error:', {
      status: brevoResponse.status,
      error: errorData,
      email: identifier,
    });
  }

  console.warn('Continuing to update Firestore despite Brevo error');
}
