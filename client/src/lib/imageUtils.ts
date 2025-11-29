/**
 * Utility function to transform image URLs for proper display
 * Converts .private/ paths to /objects/ endpoints
 */
export function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // If it's already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's already an /objects/ path, return as-is
  if (url.startsWith('/objects/')) {
    return url;
  }
  
  // Convert .private/ paths to /objects/
  if (url.startsWith('.private/')) {
    return `/objects/${url.replace('.private/', '')}`;
  }
  
  // For other paths, assume they might need /objects/ prefix
  if (!url.startsWith('/')) {
    return `/objects/${url}`;
  }
  
  return url;
}
