import { signInWithPopup, GoogleAuthProvider, signOut, User, deleteUser } from 'firebase/auth';
import { auth, initFirebase } from '@/firebase/firebaseConfig';
import { allowedResearcherAddresses } from '@/data/allowedResearcherAddresses';

initFirebase();

const provider = new GoogleAuthProvider();

export async function signInTaskMasterWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const email = result.user.email;
    if (!email || !allowedResearcherAddresses.includes(email)) {
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
}

export function getCurrentTaskMaster(): User | null {
  return auth.currentUser;
} 