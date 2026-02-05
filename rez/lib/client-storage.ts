/**
 * Open a file from Firebase Storage in a new tab
 * Requires authentication - uses server-side API route that checks auth
 * @param filePath - Path to the file in storage (e.g., 'website_assets/guide.pdf')
 * @param filename - Filename for display (e.g., 'guide.pdf')
 */
export async function downloadFileFromStorage(filePath: string, filename: string): Promise<void> {
  try {
    // Extract just the filename from the path (e.g., 'guide.pdf' from 'website_assets/guide.pdf')
    const fileName = filePath.split('/').pop() || filename;
    
    // Use our authenticated API route to get the file
    const apiUrl = `/api/download/${encodeURIComponent(fileName)}`;
    
    // Open in a new tab - the API route will handle authentication and streaming
    window.open(apiUrl, '_blank');
  } catch (error) {
    console.error('Error opening file from Firebase Storage:', error);
    throw error;
  }
}
