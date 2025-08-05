import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.PAX_FIREBASE_PROJECT_ID,
      clientEmail: process.env.PAX_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.PAX_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const paxDB = getFirestore(); 