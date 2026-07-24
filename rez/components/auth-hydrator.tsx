import { useEffect } from "react";
import { onAuthStateChanged, onIdTokenChanged } from "firebase/auth";
import { auth, firestore } from "@/firebase/clientConfig";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { doc, getDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/firestore/constants/collections";
import {
  clearAuthCookies,
  clearOrganizationIdCookie,
  setFirebaseTokenCookie,
  setOrganizationIdCookie,
} from "@/lib/auth-cookies";

/**
 * Updates the firebaseToken cookie with the current ID token
 */
async function updateTokenCookie(user: { getIdToken: () => Promise<string> } | null) {
  if (user) {
    try {
      const token = await user.getIdToken();
      setFirebaseTokenCookie(token);
    } catch (error) {
      console.error("Error updating token cookie:", error);
    }
  } else {
    clearAuthCookies();
  }
}

export function AuthHydrator() {
  const setUser = useTaskMasterStore((state) => state.setUser);

  useEffect(() => {
    if (!auth || !firestore) return;
    const db = firestore;
    // Listen to auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Update token cookie whenever auth state changes
        await updateTokenCookie(user);

        // Try to fetch the full TaskMaster from Firestore
        const ref = doc(db, COLLECTIONS.TASK_MASTERS, user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          const organizationId = data.organizationId || null;
          if (organizationId) {
            setOrganizationIdCookie(organizationId);
          } else {
            clearOrganizationIdCookie();
          }
          // Explicitly map all fields including isSuperAdmin
          setUser({
            id: data.id || user.uid,
            name: data.name || null,
            emailAddress: data.emailAddress || null,
            profilePictureURI: data.profilePictureURI || null,
            organizationId,
            privyDid: data.privyDid || null,
            isSuperAdmin: data.isSuperAdmin === true,
          });
        } else {
          clearOrganizationIdCookie();
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
