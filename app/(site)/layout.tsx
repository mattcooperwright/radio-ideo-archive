import Link from 'next/link';
import { BroadcastField } from '@/components/BroadcastField';
import { StarIcon } from '@/components/Icons';
import { PlayerBar } from '@/components/PlayerBar';
import { PlayerProvider } from '@/components/PlayerProvider';
import { SignOut } from '@/components/SignOut';
import { requireUser } from '@/lib/auth';
import { isAdmin } from '@/lib/plays';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <PlayerProvider>
      <BroadcastField />
      <header className="header">
        <Link href="/" className="header__logo" aria-label="Radio IDEO home">
          <img src="/brand/radio-ideo-wordmark-white.svg" alt="Radio IDEO" width="430" height="92" className="logo--on-dark" />
          <img src="/brand/radio-ideo-wordmark-black.svg" alt="" width="430" height="92" className="logo--on-light" />
        </Link>
        <div className="header__user">
          <Link href="/hall-of-fame" className="header__link">
            <StarIcon size={13} /> Hall of Fame
          </Link>
          {isAdmin(user.email) && (
            <>
              <Link href="/invites" className="header__link">
                Invites
              </Link>
              <Link href="/stats" className="header__link">
                Stats
              </Link>
            </>
          )}
          <span className="header__email">{user.email}</span>
          <SignOut />
        </div>
      </header>
      <main className="main">{children}</main>
      <PlayerBar />
    </PlayerProvider>
  );
}
