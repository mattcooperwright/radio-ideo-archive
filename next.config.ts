import type { NextConfig } from 'next';

// Next.js needs inline scripts and styles, so the script policy cannot be strict without per-request
// nonces. The directives that do not depend on that (framing, base URI, form targets, plugins) are
// enforced now. The full policy ships as Report-Only so it can be tightened without breaking sign-in.
const googleAuth = [
  'https://*.googleapis.com',
  'https://accounts.google.com',
  'https://apis.google.com',
  'https://*.firebaseapp.com',
];

const enforced = ["frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'"].join('; ');

const reportOnly = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${googleAuth.join(' ')}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.cdnfonts.com",
  "font-src 'self' https://fonts.gstatic.com https://fonts.cdnfonts.com",
  "img-src 'self' data: blob: https://*.googleusercontent.com",
  "media-src 'self' blob:",
  `connect-src 'self' ${googleAuth.join(' ')}`,
  `frame-src ${googleAuth.join(' ')}`,
  enforced,
].join('; ');

const nextConfig: NextConfig = {
  serverExternalPackages: ['firebase-admin'],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: enforced },
          { key: 'Content-Security-Policy-Report-Only', value: reportOnly },
        ],
      },
    ];
  },
};

export default nextConfig;
