'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addInvite, removeInvite } from '@/lib/access';
import { requireUser } from '@/lib/auth';
import { isValidEmail, normaliseEmail } from '@/lib/email';
import { isAdmin } from '@/lib/plays';

async function requireAdmin() {
  const user = await requireUser();
  if (!isAdmin(user.email)) throw new Error('Forbidden');
  return user;
}

export async function addInviteAction(formData: FormData) {
  const user = await requireAdmin();
  const email = normaliseEmail(String(formData.get('email') ?? ''));
  if (!isValidEmail(email)) redirect('/invites?error=invalid');
  await addInvite(email, user.email);
  revalidatePath('/invites');
  redirect('/invites');
}

export async function removeInviteAction(formData: FormData) {
  await requireAdmin();
  const email = normaliseEmail(String(formData.get('email') ?? ''));
  if (email) await removeInvite(email);
  revalidatePath('/invites');
}
