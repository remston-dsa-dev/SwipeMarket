/**
 * Reusable form validators. Centralised so sign-up, sign-in, and any future
 * "change password" / "reset password" flows stay consistent.
 */

/**
 * Practical email regex — matches the vast majority of real-world addresses
 * without trying to fully implement RFC 5322 (which would be far too permissive
 * for a sign-up form). Mirrors what most major web apps enforce client-side.
 */
export const EMAIL_REGEX =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/** RFC 3696 cap on the full address. */
export const EMAIL_MAX_LENGTH = 254;

/** Supabase hashes passwords with bcrypt, which silently truncates past 72 bytes. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export type PasswordCheck = {
  id: "length" | "upper" | "lower" | "number" | "symbol";
  label: string;
  passed: boolean;
};

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required";
  if (trimmed.length > EMAIL_MAX_LENGTH) return "Email is too long";
  if (!EMAIL_REGEX.test(trimmed)) return "Enter a valid email address";
  return null;
}

export function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    {
      id: "length",
      label: `${PASSWORD_MIN_LENGTH}+ characters`,
      passed:
        password.length >= PASSWORD_MIN_LENGTH &&
        password.length <= PASSWORD_MAX_LENGTH,
    },
    { id: "upper",  label: "Uppercase", passed: /[A-Z]/.test(password) },
    { id: "lower",  label: "Lowercase", passed: /[a-z]/.test(password) },
    { id: "number", label: "Number",    passed: /\d/.test(password) },
    {
      id: "symbol",
      label: "Symbol",
      passed: /[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]/.test(password),
    },
  ];
}

export function isPasswordStrong(password: string): boolean {
  return getPasswordChecks(password).every((c) => c.passed);
}

/** Continuous 0..1 strength signal — drives the strength meter and input border tint. */
export function passwordScore(password: string): number {
  if (!password) return 0;
  const checks = getPasswordChecks(password);
  return checks.filter((c) => c.passed).length / checks.length;
}

/**
 * Continuous 0..1 progress signal for an email as the user types.
 * Lets the UI gradient smoothly from neutral → amber → green instead of
 * snapping from "no feedback" to "valid".
 */
export function emailScore(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (EMAIL_REGEX.test(trimmed)) return 1;
  if (!trimmed.includes("@")) return 0.25;

  const [local, domain] = trimmed.split("@");
  if (!local || !domain) return 0.3;
  if (!domain.includes(".")) return 0.5;

  const tld = domain.split(".").pop() ?? "";
  if (tld.length < 2) return 0.7;
  return 0.8;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (/\s/.test(password)) return "Password cannot contain spaces";
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer`;
  }
  if (!isPasswordStrong(password)) {
    return "Password does not meet all requirements";
  }
  return null;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): string | null {
  if (!confirmPassword) return "Confirm your password";
  if (password !== confirmPassword) return "Passwords do not match";
  return null;
}
