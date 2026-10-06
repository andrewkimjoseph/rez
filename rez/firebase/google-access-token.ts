import { importPKCS8, SignJWT } from 'jose';

export type ServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

type CachedToken = {
  token: string;
  expiresAt: number;
};

const tokens = new Map<string, CachedToken>();

export function readServiceAccount(prefix: 'PAX' | 'REZ'): ServiceAccount {
  const projectId = process.env[`${prefix}_FIREBASE_PROJECT_ID`];
  const clientEmail = process.env[`${prefix}_FIREBASE_CLIENT_EMAIL`];
  const privateKey = process.env[`${prefix}_FIREBASE_PRIVATE_KEY`]?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(`Missing ${prefix} Firebase service account credentials`);
  }

  return { projectId, clientEmail, privateKey };
}

export async function getGoogleAccessToken(
  account: ServiceAccount,
  scope: string,
): Promise<string> {
  const cacheKey = `${account.clientEmail}:${scope}`;
  const cached = tokens.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt - 60_000) {
    return cached.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const privateKey = await importPKCS8(account.privateKey, 'RS256');
  const assertion = await new SignJWT({ scope })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(account.clientEmail)
    .setSubject(account.clientEmail)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const data = (await response.json()) as { access_token?: string };
  if (!response.ok || typeof data.access_token !== 'string') {
    throw new Error(`Failed to mint a Google access token for ${account.clientEmail}`);
  }

  tokens.set(cacheKey, {
    token: data.access_token,
    expiresAt: Date.now() + 3600 * 1000,
  });
  return data.access_token;
}
