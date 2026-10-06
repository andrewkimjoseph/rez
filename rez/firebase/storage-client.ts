import { importPKCS8 } from 'jose';
import type { ServiceAccount } from './google-access-token';

const STORAGE_HOST = 'storage.googleapis.com';

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function timestampParts(date: Date): { datestamp: string; timestamp: string } {
  const iso = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return { datestamp: iso.slice(0, 8), timestamp: iso };
}

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function signedStorageReadUrl(
  account: ServiceAccount,
  bucket: string,
  objectPath: string,
  filename: string,
  expiresSeconds = 900,
): Promise<string> {
  const now = timestampParts(new Date());
  const credentialScope = `${now.datestamp}/auto/storage/goog4_request`;
  const credential = `${account.clientEmail}/${credentialScope}`;
  const canonicalUri = `/${bucket}/${objectPath.split('/').map(encodeRfc3986).join('/')}`;
  const query = [
    ['X-Goog-Algorithm', 'GOOG4-RSA-SHA256'],
    ['X-Goog-Credential', credential],
    ['X-Goog-Date', now.timestamp],
    ['X-Goog-Expires', String(expiresSeconds)],
    ['X-Goog-SignedHeaders', 'host'],
    ['response-content-disposition', `attachment; filename="${filename}"`],
    ['response-content-type', 'application/pdf'],
  ]
    .sort((left, right) => (left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0))
    .map(([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`)
    .join('&');

  const canonicalRequest = [
    'GET',
    canonicalUri,
    query,
    `host:${STORAGE_HOST}\n`,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');
  const payloadHash = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest)));
  const stringToSign = ['GOOG4-RSA-SHA256', now.timestamp, credentialScope, payloadHash].join('\n');
  const key = await importPKCS8(account.privateKey, 'RS256');
  const signature = hex(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(stringToSign)),
  );

  return `https://${STORAGE_HOST}${canonicalUri}?${query}&X-Goog-Signature=${signature}`;
}
