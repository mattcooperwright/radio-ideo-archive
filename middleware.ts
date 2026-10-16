import { NextResponse, type NextRequest } from 'next/server';

// Fast gate on cookie presence only. Pages and API routes verify the session properly.
export function middleware(req: NextRequest) {
  if (req.cookies.has('__session')) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!login|api/session|_next/|brand/|favicon.ico|robots.txt).*)'],
};
