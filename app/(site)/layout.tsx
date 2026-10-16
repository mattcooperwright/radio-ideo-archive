import Link from 'next/link';
import { PlayerBar } from '@/components/PlayerBar';
import { PlayerProvider } from '@/components/PlayerProvider';
import { SignOut } from '@/components/SignOut';
import { requireUser } from '@/lib/auth';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <PlayerProvider>
      <header className="header">
        <Link href="/" className="header__logo" aria-label="Radio IDEO home">
          <img src="/brand/logo.svg" alt="Radio IDEO" />
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
