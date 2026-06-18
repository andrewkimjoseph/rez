/**
 * One-time backfill: sync all answerPoll tasks from Pax Firestore to Supabase Insights.
 *
 * Usage (from rez/rez with env configured):
 *   npx tsx scripts/backfill-poll-publication.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function main() {
  const { paxDB } = await import('../firebase/serverConfig');
  const { COLLECTIONS } = await import('../firebase/firestore/constants/collections');
  const { syncPollFromFirestoreTask } = await import('../services/syncPollPublication');

  const snapshot = await paxDB.collection(COLLECTIONS.TASKS).where('type', '==', 'answerPoll').get();
  console.log(`Found ${snapshot.size} answerPoll tasks`);

  let synced = 0;
  let failed = 0;

  for (const doc of snapshot.docs) {
    try {
      await syncPollFromFirestoreTask(doc.id);
      synced += 1;
      console.log(`Synced ${doc.id}`);
    } catch (error) {
      failed += 1;
      console.error(`Failed ${doc.id}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`Done. synced=${synced} failed=${failed}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
