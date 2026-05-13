/** Supabase returns an empty identities array when the email is already registered (signup). */
export function isSignUpEmailAlreadyRegistered(user: { identities?: unknown[] } | null): boolean {
  return !!user && Array.isArray(user.identities) && user.identities.length === 0;
}

export function formatSignInError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
    return [
      "That email and password did not match.",
      "If you just signed up, confirm your email from the inbox link first, then try again.",
      "If you use Google for this account, use “Sign in with Google” instead.",
    ].join("\n\n");
  }
  return message;
}

export function formatSignUpError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("user already")) {
    return "An account with this email already exists. Sign in instead, or use Google if you registered that way.";
  }
  return message;
}
