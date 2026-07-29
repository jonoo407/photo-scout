/* Password rules (2026-07-29).

   Checked client-side purely so the user gets an instant, specific message;
   the server is the real gate. Supabase's project default was 6 characters
   with no class requirement, which is too weak to start accepting — the
   project config was raised to match these numbers at the same time.

   Deliberately NOT a complexity maze. Length does far more work than symbol
   quotas, and rules people can't satisfy push them toward `Password1!` and a
   sticky note. Two character classes plus real length is the floor. */

export const MIN_PASSWORD_LENGTH = 10

/** Returns a human explanation of what's wrong, or null when it's acceptable. */
export function passwordProblem(password: string): string | null {
  if (!password) return 'Choose a password.'
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters — length matters more than symbols.`
  }
  const classes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length
  if (classes < 2) {
    return 'Mix in a second kind of character — a capital, a number, a space or a symbol.'
  }
  return null
}
