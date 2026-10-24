/**
 * Privacy masking utility
 * If user is authenticated, returns the real name.
 * If user is a public/unauthenticated guest, returns initials only (e.g. "R. P. K.")
 */
export function getMaskedName(name, isLoggedIn) {
  if (isLoggedIn) return name;
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase() + '.')
    .join(' ');
}
