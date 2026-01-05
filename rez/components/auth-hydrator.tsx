import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firestore } from "@/firebase/clientConfig";
import { useTaskMasterStore } from "@/stores/taskmaster-store";
import { doc, getDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/firebase/firestore/constants/collections";
import { TaskMasterStoreUser } from "@/stores/taskmaster-store";

export function AuthHydrator() {
  const setUser = useTaskMasterStore((state) => state.setUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
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
      }
    });
    return () => unsubscribe();
  }, [setUser]);

  return null;
} 