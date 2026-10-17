import Link from 'next/link';
import { BroadcastField } from '@/components/BroadcastField';
import { PlayerBar } from '@/components/PlayerBar';
import { PlayerProvider } from '@/components/PlayerProvider';
import { SignOut } from '@/components/SignOut';
import { requireUser } from '@/lib/auth';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <PlayerProvider>
      <BroadcastField />
      <header className="header">
        <Link href="/" className="header__logo" aria-label="Radio IDEO home">
          <img src="/brand/radio-ideo-wordmark-white.svg" alt="Radio IDEO" width="430" height="92" />
        </Link>
        <div className="header__user">
          <span className="header__email">{user.email}</span>
          <SignOut />
        </div>
      </header>
      <main className="main">{children}</main>
      <PlayerBar />
    </PlayerProvider>
  );
}
