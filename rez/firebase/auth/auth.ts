import { signInWithPopup, GoogleAuthProvider, signOut, User, deleteUser } from 'firebase/auth';
import { auth, initFirebase } from '@/firebase/clientConfig';
import { allowedResearcherEmailAddresses } from '@/data/allowedResearcherEmailAddresses';

initFirebase();

const provider = new GoogleAuthProvider();

export async function signInTaskMasterWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const email = result.user.email;
    if (!email || !allowedResearcherEmailAddresses.includes(email)) {
      await signOutTaskMaster();
      try {
        await deleteUser(result.user);
      } catch (deleteError) {
        // Ignore delete errors (e.g., if user already deleted or not authenticated)
      }
      throw { code: 'auth/email-not-allowed', message: 'This email is not allowed to sign in.' };
    }
    return result.user;
  } catch (error) {
    throw error;
  }
}

export async function signOutTaskMaster() {
  await signOut(auth);
  
  // Clear cookies created during authentication
  document.cookie = 'firebaseToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
  document.cookie = 'organizationId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
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
    // Update cookie with fresh token
    document.cookie = `firebaseToken=${token}; path=/; max-age=3600; SameSite=Lax`;
    return token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
} 