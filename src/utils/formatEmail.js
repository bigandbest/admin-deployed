/**
 * Returns a display-safe email string.
 * Phone-auth users get a placeholder like phone_91XXXXXXXXXX@bbm.local
 * which should never be shown to admins — return null instead.
 */
export function formatEmail(email) {
  if (!email) return null;
  const e = String(email).trim().toLowerCase();
  if (e.endsWith("@bbm.local") || e.endsWith("@riders.local") || e.endsWith("@bigbestmart.com")) return null;
  return email;
}
