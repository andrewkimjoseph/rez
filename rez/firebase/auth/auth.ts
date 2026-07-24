import { signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth, initFirebase } from '@/firebase/clientConfig';
import { clearAuthCookies, setFirebaseTokenCookie } from '@/lib/auth-cookies';

initFirebase();

const provider = new GoogleAuthProvider();

export async function signInTaskMasterWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    throw error;
  }
}

export async function signOutTaskMaster() {
  await signOut(auth);
  
  // Clear cookies created during authentication
  clearAuthCookies();
}

export function getCurrentTaskMaster(): User | null {
  return auth.currentUser;
}

/**
 * Ensures the Firebase ID token is fresh and updates the cookie
 * Call this before making API requests to prevent token expiration errors
 */
export async function ensureFreshToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  
  try {
    // Force token refresh to get a fresh token
    const token = await user.getIdToken(true);
    setFirebaseTokenCookie(token);
    return token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
} 