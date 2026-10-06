import { importX509, jwtVerify } from 'jose';
import { getGoogleAccessToken, type ServiceAccount } from './google-access-token';

const CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

type FirebaseAppName = 'paxApp' | 'rezApp';

type CertCache = {
  certs: Record<string, string>;
  expiresAt: number;
};

let certCache: CertCache | null = null;

export class FirebaseAuthError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function firebaseCerts(): Promise<Record<string, string>> {
  if (certCache && Date.now() < certCache.expiresAt) return certCache.certs;

  const response = await fetch(CERTS_URL);
  if (!response.ok) {
    throw new FirebaseAuthError('auth/argument-error', 'Failed to load Firebase token certificates');
  }

  const certs = (await response.json()) as Record<string, string>;
  const cacheControl = response.headers.get('cache-control') ?? '';
  const maxAge = /max-age=(\d+)/.exec(cacheControl);
  certCache = {
    certs,
    expiresAt: Date.now() + (maxAge ? Number(maxAge[1]) * 1000 : 60 * 60 * 1000),
  };
  return certs;
}

async function lookupAccount(account: ServiceAccount, uid: string) {
  const token = await getGoogleAccessToken(account, CLOUD_PLATFORM_SCOPE);
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${account.projectId}/accounts:lookup`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ localId: [uid] }),
    },
  );

  const body = (await response.json()) as {
    users?: Array<{ localId?: string; email?: string; disabled?: boolean; validSince?: string }>;
  };
  if (!response.ok) {
    throw new FirebaseAuthError('auth/user-not-found', `Failed to look up Firebase user ${uid}`);
  }
  return body.users?.[0] ?? null;
}

export function createAuth(loadAccount: () => ServiceAccount) {
  return {
    async verifyIdToken(idToken: string, checkRevoked = false) {
      try {
        const [encodedHeader] = idToken.split('.');
        if (!encodedHeader) {
          throw new FirebaseAuthError('auth/argument-error', 'Invalid auth token format');
        }
        const header = JSON.parse(
          atob(encodedHeader.replace(/-/g, '+').replace(/_/g, '/')),
        ) as { kid?: string };
        if (!header.kid) {
          throw new FirebaseAuthError('auth/argument-error', 'Invalid auth token format');
        }

        const account = loadAccount();
        const certs = await firebaseCerts();
        const pem = certs[header.kid];
        if (!pem) {
          throw new FirebaseAuthError('auth/argument-error', 'Unknown Firebase token key');
        }

        const key = await importX509(pem, 'RS256');
        const { payload } = await jwtVerify(idToken, key, {
          issuer: `https://securetoken.google.com/${account.projectId}`,
          audience: account.projectId,
        });

        const uid = typeof payload.sub === 'string' ? payload.sub : '';
        if (!uid) {
          throw new FirebaseAuthError('auth/argument-error', 'Auth token is missing a subject');
        }

        if (checkRevoked) {
          const user = await lookupAccount(account, uid);
          const authTime = typeof payload.auth_time === 'number' ? payload.auth_time : 0;
          const validSince = Number(user?.validSince ?? 0);
          if (!user || (validSince > 0 && authTime < validSince)) {
            throw new FirebaseAuthError('auth/id-token-revoked', 'Auth token has been revoked');
          }
        }

        return {
          uid,
          email: typeof payload.email === 'string' ? payload.email : undefined,
        };
      } catch (error) {
        if (error instanceof FirebaseAuthError) throw error;
        const code = (error as { code?: string }).code;
        if (code === 'ERR_JWT_EXPIRED') {
          throw new FirebaseAuthError('auth/id-token-expired', 'Auth token expired');
        }
        throw new FirebaseAuthError('auth/argument-error', 'Invalid auth token format');
      }
    },

    async getUser(uid: string) {
      const user = await lookupAccount(loadAccount(), uid);
      if (!user) {
        throw new FirebaseAuthError('auth/user-not-found', `Firebase user ${uid} was not found`);
      }
      return {
        uid: user.localId ?? uid,
        email: user.email,
        disabled: user.disabled === true,
      };
    },

    async getUsers(identifiers: Array<{ uid: string }>) {
      const account = loadAccount();
      const token = await getGoogleAccessToken(account, CLOUD_PLATFORM_SCOPE);
      const users: Array<{ uid: string; email?: string; disabled: boolean }> = [];
      const notFound: Array<{ uid: string }> = [];

      for (let index = 0; index < identifiers.length; index += 100) {
        const chunk = identifiers.slice(index, index + 100).map((identifier) => identifier.uid);
        const response = await fetch(
          `https://identitytoolkit.googleapis.com/v1/projects/${account.projectId}/accounts:lookup`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ localId: chunk }),
          },
        );
        const body = (await response.json()) as {
          users?: Array<{ localId?: string; email?: string; disabled?: boolean }>;
        };
        if (!response.ok) {
          throw new FirebaseAuthError('auth/internal-error', 'Failed to look up Firebase users');
        }

        const found = new Set<string>();
        for (const user of body.users ?? []) {
          const uid = user.localId ?? '';
          if (!uid) continue;
          found.add(uid);
          users.push({
            uid,
            email: user.email,
            disabled: user.disabled === true,
          });
        }
        for (const uid of chunk) {
          if (!found.has(uid)) notFound.push({ uid });
        }
      }

      return { users, notFound };
    },

    async updateUser(uid: string, properties: { disabled?: boolean }) {
      const account = loadAccount();
      const token = await getGoogleAccessToken(account, CLOUD_PLATFORM_SCOPE);
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/projects/${account.projectId}/accounts:update`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            localId: uid,
            disableUser: properties.disabled,
          }),
        },
      );

      if (!response.ok) {
        throw new FirebaseAuthError('auth/internal-error', `Failed to update Firebase user ${uid}`);
      }

      return { uid, disabled: properties.disabled === true };
    },
  };
}

const accounts = new Map<FirebaseAppName, ReturnType<typeof createAuth>>();

export function getApp(name: FirebaseAppName) {
  return { name };
}

export function getAuth(
  app: { name: FirebaseAppName },
  loadAccount: (name: FirebaseAppName) => ServiceAccount,
) {
  const existing = accounts.get(app.name);
  if (existing) return existing;
  const auth = createAuth(() => loadAccount(app.name));
  accounts.set(app.name, auth);
  return auth;
}
