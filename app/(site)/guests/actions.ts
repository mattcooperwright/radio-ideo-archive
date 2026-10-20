'use server';

import { revalidatePath } from 'next/cache';
import { deleteGuest } from '@/lib/access';
import { requireUser } from '@/lib/auth';
import { isAdmin } from '@/lib/plays';

export async function deleteGuestAction(formData: FormData) {
  const user = await requireUser();
  if (!isAdmin(user.email)) throw new Error('Forbidden');
  const uid = String(formData.get('uid') ?? '');
  if (uid) await deleteGuest(uid);
  revalidatePath('/guests');
}
