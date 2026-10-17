import { ALLOWED_DOMAIN } from './config';

export function isAllowedEmail(email: string | undefined | null, emailVerified: boolean | undefined): boolean {
  if (!email || emailVerified !== true) return false;
  const at = email.lastIndexOf('@');
  if (at < 1) return false;
  return email.slice(at + 1).toLowerCase() === ALLOWED_DOMAIN;
}
