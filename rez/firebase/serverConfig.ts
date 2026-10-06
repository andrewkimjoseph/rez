import { createFirestore } from './firestore-client';
import { readServiceAccount } from './google-access-token';
import { signedStorageReadUrl } from './storage-client';

export const paxDB = createFirestore(() => readServiceAccount('PAX'));
export const rezDB = createFirestore(() => readServiceAccount('REZ'));

export async function signedRezStorageUrl(bucket: string, objectPath: string, filename: string) {
  return signedStorageReadUrl(readServiceAccount('REZ'), bucket, objectPath, filename);
}
