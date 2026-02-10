/**
 * Utility functions for URL generation and handling
 */

/**
 * Generate a short URL-friendly slug from a project name
 * @param projectName - The project name to convert to a slug
 * @returns A short URL-friendly slug with random identifier
 */
export function generateProjectSlug(projectName: string): string {
  // Convert to lowercase and replace spaces with hyphens
  let slug = projectName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    // Remove special characters except alphanumeric and hyphens
    .replace(/[^a-z0-9\-]/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
  
  // If slug is empty or too short, use a default
  if (slug.length < 2) {
    slug = 'project';
  }
  
  // Generate a short random identifier (6 characters)
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomId = '';
  for (let i = 0; i < 6; i++) {
    randomId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${slug}-${randomId}`;
}

/**
 * Extract project ID from a slug (if it contains one)
 * This is for backward compatibility with existing ID-based URLs
 * @param slug - The slug or ID to parse
 * @returns The project ID if found, null otherwise
 */
export function extractProjectId(slug: string): string | null {
  // If it's a valid UUID, return it directly
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(slug)) {
    return slug;
  }
  
  // If it's our custom slug format (name-1234), we'd need to look up the ID
  // For now, return null to indicate we need to query by slug
  return null;
}

/**
 * Generate the submission form URL for a project
 * @param projectId - The project ID
 * @param projectName - The project name (optional, for slug generation)
 * @returns The full URL for the submission form
 */
export function generateSubmissionUrl(projectId: string, projectName?: string): string {
  // For now, we'll keep using the ID-based URLs for simplicity
  // But we can enhance this later to use slugs
  return `${window.location.origin}/submit/${projectId}`;
}

/**
 * Generate a user-friendly URL for sharing
 * @param projectName - The project name
 * @param projectId - The project ID
 * @returns A user-friendly URL string
 */
export function generateShareableUrl(projectName: string, projectId: string): string {
  const slug = generateProjectSlug(projectName);
  // For sharing purposes, we can show the slug version
  // but the actual link will still use the ID for reliability
  return `${window.location.origin}/submit/${projectId} (${slug})`;
}