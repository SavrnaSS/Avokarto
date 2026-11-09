export type PasswordStrengthLabel = "Weak" | "Medium" | "Strong";

export interface PasswordStrengthResult {
  label: PasswordStrengthLabel;
  color: string;
  progress: number;
}

export function getPasswordStrength(value: string): PasswordStrengthResult {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 1) {
    return { label: "Weak", color: "#dc3545", progress: 33 };
  }
  if (score <= 3) {
    return { label: "Medium", color: "#ff9800", progress: 66 };
  }
  return { label: "Strong", color: "#198754", progress: 100 };
}

interface PasswordErrorOptions {
  /** true: all four checks ("Strong"). false: 8+ characters plus a number, symbol or capital ("Medium"). */
  requireStrong?: boolean;
}

/** The relaxed rule used by quick sign-up and password changes. */
export const RELAXED_PASSWORD_MESSAGE = "Use 8+ characters with a number, symbol or capital letter.";

export function getPasswordValidationError(
  password: string,
  confirmPassword: string,
  options: PasswordErrorOptions = {},
): string {
  const { requireStrong = true } = options;
  const strength = getPasswordStrength(password);

  if (password.length > 0 && password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (password.length > 0 && requireStrong && strength.label !== "Strong") {
    return "Password must be Strong to continue.";
  }
  if (password.length > 0 && !requireStrong && strength.label === "Weak") {
    return RELAXED_PASSWORD_MESSAGE;
  }
  if (confirmPassword.length > 0 && password !== confirmPassword) {
    return "Passwords do not match.";
  }
  return "";
}
