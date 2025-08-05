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
          setUser(snap.data() as TaskMasterStoreUser);
        } else {
          setUser({
            id: user.uid,
            name: user.displayName || null,
            emailAddress: user.email || null,
            profilePictureURI: user.photoURL || null,
            organizationId: null,
            privyDid: null,
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