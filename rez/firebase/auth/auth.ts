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