import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { MOCK_AUTH } from '@/lib/config';
import { LoginButton } from './LoginButton';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await getUser()) redirect('/');
  return (
    <main className="login">
      <div className="login__card">
        <img src="/brand/radio-ideo-stacked-lime.png" alt="Radio IDEO" width="568" height="568" className="login__logo" />
        <p className="login__lede">Every show, on demand. For IDEO people.</p>
        <LoginButton mock={MOCK_AUTH} />
      </div>
    </main>
  );
}
