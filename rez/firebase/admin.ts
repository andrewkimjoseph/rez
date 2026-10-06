import { FieldValue, Timestamp } from 'fires2rest';
import { getApp as getNamedApp, getAuth as getNamedAuth } from './auth-client';
import { readServiceAccount } from './google-access-token';

export type FirestoreFieldValue =
  | ReturnType<typeof FieldValue.serverTimestamp>
  | InstanceType<typeof Timestamp>;

export { FieldValue, Timestamp };

export type QueryDocumentSnapshot<T = { [field: string]: any }> = {
  id: string;
  exists: boolean;
  data: () => T;
};

export type CollectionReference = {
  doc: (id?: string) => { id: string; update: (data: Record<string, unknown>) => Promise<unknown> };
  where: (
    field: string,
    op: string,
    value: unknown,
  ) => { get: () => Promise<{ docs: QueryDocumentSnapshot[] }> };
};

export function getApp(name: 'paxApp' | 'rezApp') {
  return getNamedApp(name);
}

export function getAuth(app: { name: 'paxApp' | 'rezApp' }) {
  const prefix = app.name === 'paxApp' ? 'PAX' : 'REZ';
  return getNamedAuth(app, () => readServiceAccount(prefix));
}
