import { useEffect } from "react";
import { onAuthStateChanged, onIdTokenChanged } from "firebase/auth";
import { auth, firestore } from "@/firebase/clientConfig";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { doc, getDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/firestore/constants/collections";
import { TaskMasterStoreUser } from "@/stores/taskmaster-store";

/**
 * Updates the firebaseToken cookie with the current ID token
 */
async function updateTokenCookie(user: any) {
  if (user) {
    try {
      const token = await user.getIdToken();
      // Set cookie with secure flags (httpOnly is not set so client can read it)
      document.cookie = `firebaseToken=${token}; path=/; max-age=3600; SameSite=Lax`;
    } catch (error) {
      console.error('Error updating token cookie:', error);
    }
  } else {
    // Clear cookie if user is null
    document.cookie = 'firebaseToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
  }
}

export function AuthHydrator() {
  const setUser = useTaskMasterStore((state) => state.setUser);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Update token cookie whenever auth state changes
        await updateTokenCookie(user);
        
        // Try to fetch the full TaskMaster from Firestore
        const ref = doc(firestore, COLLECTIONS.TASK_MASTERS, user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          // Explicitly map all fields including isSuperAdmin
          setUser({
            id: data.id || user.uid,
            name: data.name || null,
            emailAddress: data.emailAddress || null,
            profilePictureURI: data.profilePictureURI || null,
            organizationId: data.organizationId || null,
            privyDid: data.privyDid || null,
            isSuperAdmin: data.isSuperAdmin === true,
          });
        } else {
          setUser({
            id: user.uid,
            name: user.displayName || null,
            emailAddress: user.email || null,
            profilePictureURI: user.photoURL || null,
            organizationId: null,
            privyDid: null,
            isSuperAdmin: false,
          });
        }
      } else {
        setUser(null);
        updateTokenCookie(null);
      }
    });

    // Listen to ID token changes (fires when token is refreshed automatically)
    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      if (user) {
        // Update cookie whenever token is refreshed
        await updateTokenCookie(user);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
    };
  }, [setUser]);

  return null;
} 