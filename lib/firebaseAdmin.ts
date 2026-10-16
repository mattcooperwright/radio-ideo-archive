import 'server-only';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// On App Hosting, credentials and project come from the environment automatically.
export function adminAuth() {
  if (!getApps().length) initializeApp();
  return getAuth();
}
