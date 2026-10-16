import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Radio IDEO',
  description: 'The Radio IDEO archive',
  icons: { icon: '/brand/logo.svg' },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
