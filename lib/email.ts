import { ALLOWED_DOMAIN } from './config';

export function isAllowedEmail(email: string | undefined | null, emailVerified: boolean | undefined): boolean {
  if (!email || emailVerified !== true) return false;
  const at = email.lastIndexOf('@');
  if (at < 1) return false;
  return email.slice(at + 1).toLowerCase() === ALLOWED_DOMAIN;
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
