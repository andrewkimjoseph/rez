/**
 * Download a PDF from our API (auth via cookies, no CORS).
 * Fetches as blob from same-origin API, then triggers a download with the given filename.
 */
export async function downloadFileFromStorage(filePath: string, filename: string): Promise<void> {
  const apiPath = filePath.includes('playbook') ? '/api/download/playbook' : '/api/download/guide';
  try {
    const res = await fetch(apiPath, { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Please sign in to download this file');
      throw new Error(`Failed to load file: ${res.statusText}`);
    }
    const blob = await res.blob();
    const blobURL = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobURL;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobURL);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}
