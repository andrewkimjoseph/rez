import {
  DocumentReference as FirestoreDocumentReference,
  Firestore,
  Timestamp,
  fromFirestoreFields,
  type FirestoreValue,
  type Query,
} from 'fires2rest';
import type { ServiceAccount } from './google-access-token';

type OrderConstraint = {
  field: { fieldPath: string };
};

type RawSnapshot = {
  exists: boolean;
  id: string;
  path: string;
  data: () => Record<string, unknown> | undefined;
};

export type DocumentData = { [field: string]: any };

export type DocumentSnapshot = {
  exists: boolean;
  id: string;
  ref: DocumentReference;
  data: () => DocumentData | undefined;
};

export type QueryDocumentSnapshot = {
  exists: true;
  id: string;
  ref: DocumentReference;
  data: () => DocumentData;
};

export type QuerySnapshot = {
  docs: QueryDocumentSnapshot[];
  empty: boolean;
  size: number;
  forEach: (callback: (doc: QueryDocumentSnapshot) => void) => void;
};

export type DocumentReference = {
  id: string;
  path: string;
  get: () => Promise<DocumentSnapshot>;
  set: (data: Record<string, unknown>, options?: { merge?: boolean }) => Promise<unknown>;
  update: (data: Record<string, unknown>) => Promise<unknown>;
  delete: () => Promise<void>;
  collection: (path: string) => CollectionReference;
};

export type QueryReference = {
  where: (field: string, op: string, value: unknown) => QueryReference;
  orderBy: (field: string, direction?: 'asc' | 'desc') => QueryReference;
  limit: (count: number) => QueryReference;
  select: (...fields: string[]) => QueryReference;
  startAfter: (cursor: unknown) => QueryReference;
  count: () => { get: () => Promise<{ data: () => { count: number } }> };
  get: () => Promise<QuerySnapshot>;
  doc: (id?: string) => DocumentReference;
};

export type CollectionReference = QueryReference;

function reviveTimestamps(value: unknown): unknown {
  if (value instanceof Date) return Timestamp.fromDate(value);
  if (Array.isArray(value)) return value.map(reviveTimestamps);
  if (value && typeof value === 'object' && !(value instanceof Timestamp)) {
    const revived: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      revived[key] = reviveTimestamps(nested);
    }
    return revived;
  }
  return value;
}

function wrapSnapshot(snap: RawSnapshot, db: Firestore): DocumentSnapshot {
  return {
    exists: snap.exists,
    id: snap.id,
    ref: wrapDoc(new FirestoreDocumentReference(db, snap.path), db),
    data() {
      const raw = snap.data();
      if (raw == null) return undefined;
      return reviveTimestamps(raw) as DocumentData;
    },
  };
}

function asQueryDocument(snap: DocumentSnapshot): QueryDocumentSnapshot {
  return snap as QueryDocumentSnapshot;
}

function isDocumentSnapshot(value: unknown): value is DocumentSnapshot {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'id' in value &&
      'exists' in value &&
      typeof (value as DocumentSnapshot).data === 'function',
  );
}

function fieldAt(data: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current == null || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[key];
  }, data);
}

function cursorValues(query: object, snap: { id: string; data: () => DocumentData | undefined }): unknown[] {
  const orders =
    (query as { _constraints?: { orderBy?: OrderConstraint[] } })._constraints?.orderBy ?? [];
  const data = snap.data() ?? {};
  if (orders.length === 0) return [snap.id];
  return orders.map((order) => {
    if (order.field.fieldPath === '__name__') return snap.id;
    return fieldAt(data, order.field.fieldPath);
  });
}

const CHAINED = new Set(['where', 'orderBy', 'limit', 'limitToLast', 'offset', 'select', 'startAt', 'endAt', 'endBefore']);

function firestoreOf(query: Query): Firestore {
  return (query as Query & { _firestore: Firestore })._firestore;
}

function wrapQuery(query: Query): QueryReference {
  return new Proxy(query, {
    get(target, prop, receiver) {
      if (prop === 'count') {
        return () => ({
          get: () => target.count(),
        });
      }

      if (prop === 'startAfter') {
        return (cursor: unknown) => {
          const values = isDocumentSnapshot(cursor) ? cursorValues(target, cursor) : [cursor];
          return wrapQuery(target.startAfter(...values));
        };
      }

      if (prop === 'get') {
        return async () => {
          const snap = await target.get();
          const db = firestoreOf(target);
          const docs = snap.docs.map((doc) => asQueryDocument(wrapSnapshot(doc, db)));
          return {
            docs,
            empty: docs.length === 0,
            size: docs.length,
            forEach(callback: (doc: QueryDocumentSnapshot) => void) {
              docs.forEach(callback);
            },
          };
        };
      }

      if (prop === 'doc') {
        return (id?: string) =>
          wrapDoc(
            (target as Query & { doc: (documentId?: string) => FirestoreDocumentReference }).doc(id),
            firestoreOf(target),
          );
      }

      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function' && CHAINED.has(String(prop))) {
        return (...args: unknown[]) => wrapQuery(value.apply(target, args));
      }
      if (typeof value === 'function') return value.bind(target);
      return value;
    },
  }) as unknown as QueryReference;
}

function wrapDoc(ref: FirestoreDocumentReference, db: Firestore): DocumentReference {
  return {
    id: ref.id,
    path: ref.path,
    get: async () => wrapSnapshot(await ref.get(), db),
    set: (data, options) => ref.set(data, options),
    update: (data) => ref.update(data),
    delete: () => ref.delete(),
    collection: (path) => wrapQuery(ref.collection(path)),
  };
}

export function createFirestore(loadAccount: () => ServiceAccount) {
  let db: Firestore | null = null;

  const getDb = () => {
    if (!db) {
      const account = loadAccount();
      db = Firestore.useServiceAccount(account.projectId, {
        clientEmail: account.clientEmail,
        privateKey: account.privateKey,
      });
    }
    return db;
  };

  return {
    collection(path: string) {
      return wrapQuery(getDb().collection(path));
    },
    doc(path: string) {
      const db = getDb();
      return wrapDoc(db.doc(path), db);
    },
    async getAll(...refs: DocumentReference[]) {
      if (refs.length === 0) return [];
      const db = getDb() as Firestore & {
        _getDatabasePath: () => string;
        _getDocumentName: (path: string) => string;
        _getHeaders: (hasBody?: boolean) => Promise<Record<string, string>>;
      };
      const snapshots: DocumentSnapshot[] = new Array(refs.length);
      const batchSize = 300;

      for (let index = 0; index < refs.length; index += batchSize) {
        const chunk = refs.slice(index, index + batchSize);
        const response = await fetch(
          `https://firestore.googleapis.com/v1/${db._getDatabasePath()}/documents:batchGet`,
          {
            method: 'POST',
            headers: await db._getHeaders(true),
            body: JSON.stringify({
              documents: chunk.map((ref) => db._getDocumentName(ref.path)),
            }),
          },
        );
        if (!response.ok) {
          throw new Error(`Firestore batchGet failed with status ${response.status}`);
        }

        const results = (await response.json()) as Array<{
          found?: { name?: string; fields?: Record<string, FirestoreValue> };
          missing?: string;
        }>;
        results.forEach((result, offset) => {
          const ref = chunk[offset];
          const fields = result.found?.fields;
          snapshots[index + offset] = wrapSnapshot(
            {
              exists: Boolean(result.found),
              id: ref?.id ?? '',
              path: ref?.path ?? '',
              data: () => (fields ? (fromFirestoreFields(fields) as Record<string, unknown>) : undefined),
            },
            db,
          );
        });
      }

      return snapshots;
    },
  };
}

export { reviveTimestamps, cursorValues };
