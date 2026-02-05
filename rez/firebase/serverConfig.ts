import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin SDK for Pax (tasks)
if (!getApps().some(app => app.name === 'paxApp')) {
  initializeApp({
    credential: cert({
      projectId: process.env.PAX_FIREBASE_PROJECT_ID,
      clientEmail: process.env.PAX_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.PAX_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  }, 'paxApp');
}

// Initialize Firebase Admin SDK for Rez (task masters)
if (!getApps().some(app => app.name === 'rezApp')) {
  initializeApp({
    credential: cert({
      projectId: process.env.REZ_FIREBASE_PROJECT_ID,
      clientEmail: process.env.REZ_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.REZ_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  }, 'rezApp');
}

export const paxDB = getFirestore(getApp('paxApp'));
export const rezDB = getFirestore(getApp('rezApp'));
export const rezStorage = getStorage(getApp('rezApp')); 