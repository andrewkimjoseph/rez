/**
 * Download a PDF from our API (auth via cookies, no CORS).
 * Fetches as blob from same-origin API, then triggers a download with the given filename.
 */
export async function downloadFileFromStorage(filePath: string, filename: string): Promise<void> {
  const apiPath = filePath.includes('playbook') ? '/api/download/playbook' : '/api/download/guide';
  return downloadResourceBySlug(filePath.includes('playbook') ? 'playbook' : 'guide', filename);
}

/**
 * Download a resource by its API slug (e.g. 'guide', 'playbook').
 */
export async function downloadResourceBySlug(slug: string, filename: string): Promise<void> {
  const apiPath = `/api/download/${slug}`;
  try {
    const res = await fetch(apiPath, { credentials: 'include', redirect: 'manual' });
    if (res.status === 401) throw new Error('Please sign in to download this file');
    if (res.status !== 302 && res.status !== 307) {
      throw new Error(`Failed to load file: ${res.statusText || res.status}`);
    }
    const url = res.headers.get('location');
    if (!url) throw new Error('Failed to load file');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}
