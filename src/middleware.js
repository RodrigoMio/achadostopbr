import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from './lib/constants.js';

export function middleware(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/products/:path*'],
};
