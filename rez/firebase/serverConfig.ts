import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let paxDB: Firestore;
let rezDB: Firestore;

// Helper function to safely initialize Firebase apps
function initializeFirebaseApps() {
  // Initialize Firebase Admin SDK for Pax (tasks)
  if (!getApps().some(app => app.name === 'paxApp')) {
    const paxConfig = {
      projectId: process.env.PAX_FIREBASE_PROJECT_ID,
      clientEmail: process.env.PAX_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.PAX_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    // Validate required fields
    if (!paxConfig.projectId || !paxConfig.clientEmail || !paxConfig.privateKey) {
      throw new Error('Missing Pax Firebase configuration. Please check environment variables.');
    }

    initializeApp({
      credential: cert(paxConfig),
    }, 'paxApp');
  }

  // Initialize Firebase Admin SDK for Rez (task masters)
  if (!getApps().some(app => app.name === 'rezApp')) {
    const rezConfig = {
      projectId: process.env.REZ_FIREBASE_PROJECT_ID,
      clientEmail: process.env.REZ_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.REZ_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    // Validate required fields
    if (!rezConfig.projectId || !rezConfig.clientEmail || !rezConfig.privateKey) {
      throw new Error('Missing Rez Firebase configuration. Please check environment variables.');
    }

    initializeApp({
      credential: cert(rezConfig),
    }, 'rezApp');
  }

  // Initialize Firestore instances
  paxDB = getFirestore(getApp('paxApp'));
  rezDB = getFirestore(getApp('rezApp'));
}

// Lazy initialization - only initialize when databases are accessed
function getPaxDB(): Firestore {
  if (!paxDB) {
    initializeFirebaseApps();
  }
  return paxDB;
}

function getRezDB(): Firestore {
  if (!rezDB) {
    initializeFirebaseApps();
  }
  return rezDB;
}

export { getPaxDB as paxDB, getRezDB as rezDB };