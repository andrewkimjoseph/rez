import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { initFirebase } from './firebaseConfig';

initFirebase();

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const auth = getAuth();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    throw error;
  }
}

export async function signOutGoogle() {
  const auth = getAuth();
  await signOut(auth);
}

export function getCurrentUser(): User | null {
  const auth = getAuth();
  return auth.currentUser;
} 