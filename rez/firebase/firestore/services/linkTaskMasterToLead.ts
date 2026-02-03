import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../clientConfig';

/**
 * Links TaskMasterLead records to a TaskMaster by updating taskMasterId.
 * This enables tracking which leads (from thecanvassing.xyz) converted to Rez accounts.
 * 
 * @param leadEmail - The email submitted on thecanvassing.xyz (from cookie or URL param)
 * @param taskMasterId - The Firebase Auth UID of the Rez user
 * @returns true if at least one lead was found and updated, false otherwise
 */
export async function linkTaskMasterToLead(
  leadEmail: string,
  taskMasterId: string
): Promise<boolean> {
  try {
    // Query for leads by email address
    const leadsRef = collection(firestore, 'taskmaster_leads');
    const q = query(leadsRef, where('leadEmailAddress', '==', leadEmail));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return false;
    }
    
    // Update all matching leads (in case of multiple submissions with same email)
    const updatePromises = snapshot.docs.map(leadDoc => 
      updateDoc(doc(firestore, 'taskmaster_leads', leadDoc.id), {
        taskMasterId: taskMasterId,
        lastActivityDate: serverTimestamp()
      })
    );
    
    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error linking TaskMaster to lead:', error);
    return false;
  }
}
