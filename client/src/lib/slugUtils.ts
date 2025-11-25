export function generateSlug(title: string, uniqueSuffix?: string): string {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 45); // Reduced from 50 to make room for suffix
  
  if (uniqueSuffix) {
    return `${baseSlug}-${uniqueSuffix}`;
  }
  
  return baseSlug;
}

export function createPermalink(id: string, title: string): string {
  const slug = generateSlug(title);
  return `${id}-${slug}`;
}

export function extractIdFromPermalink(permalink: string): string {
  const parts = permalink.split('-');
  if (parts.length < 2) return permalink;
  
  for (let i = 0; i < parts.length; i++) {
    const potential = parts.slice(0, i + 1).join('-');
    if (isValidUUID(potential)) {
      return potential;
    }
  }
  
  return parts[0];
}

function isValidUUID(str: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}
