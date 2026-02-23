import { algoliasearch } from 'algoliasearch';
import type { SearchClient } from '@algolia/client-search';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY;

let client: SearchClient | null = null;

export function getAlgoliaClient(): SearchClient {
  if (!appId || !apiKey) {
    throw new Error('Algolia is not configured: NEXT_PUBLIC_ALGOLIA_APP_ID and ALGOLIA_SEARCH_API_KEY (or ALGOLIA_ADMIN_API_KEY) are required');
  }
  if (!client) {
    client = algoliasearch(appId, apiKey) as SearchClient;
  }
  return client;
}

export function isAlgoliaConfigured(): boolean {
  return Boolean(appId && apiKey);
}
