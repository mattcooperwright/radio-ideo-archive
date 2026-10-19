import type { Metadata, Viewport } from 'next';
import { SITE_URL } from '@/lib/config';
import './globals.css';

const TITLE = 'Radio IDEO';
const DESCRIPTION = 'Every Radio IDEO show, on demand.';
const SHARE_IMAGE = { url: '/brand/og.png', width: 1200, height: 630, alt: 'Radio IDEO' };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  // Shown when a link is pasted into Slack, iMessage and the like. The pages are behind sign-in,
  // so every link unfurls with this brand card rather than anything from the archive.
  openGraph: { type: 'website', siteName: TITLE, title: TITLE, description: DESCRIPTION, images: [SHARE_IMAGE] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [SHARE_IMAGE.url] },
  icons: {
    icon: '/brand/radio-ideo-stacked-lime.png',
    apple: '/brand/radio-ideo-stacked-lime.png',
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#000000' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* FH Oscar, per brand/typography.md. Manrope is the documented fallback. */}
        <link rel="preconnect" href="https://fonts.cdnfonts.com" />
        <link rel="stylesheet" href="https://fonts.cdnfonts.com/css/fh-oscar-condensed-test" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
