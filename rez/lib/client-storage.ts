/**
 * Open a PDF from our API in a new tab (auth via cookies, no CORS).
 * Fetches as blob from same-origin API, then opens blob URL in new tab.
 */
export async function downloadFileFromStorage(filePath: string, filename: string): Promise<void> {
  const apiPath = filePath.includes('playbook') ? '/api/download/playbook' : '/api/download/guide';
  try {
    const res = await fetch(apiPath, { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Please sign in to view this file');
      throw new Error(`Failed to load file: ${res.statusText}`);
    }
    const blob = await res.blob();
    const blobURL = URL.createObjectURL(blob);
    window.open(blobURL, '_blank');
  } catch (error) {
    console.error('Error opening file:', error);
    throw error;
  }
}
