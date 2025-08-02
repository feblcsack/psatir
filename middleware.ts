import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // This is a simplified middleware - in production, you'd want to verify JWT tokens
  const path = request.nextUrl.pathname;
  
  // Public paths that don't need authentication
  const publicPaths = ['/auth/login', '/auth/register', '/'];
  
  if (publicPaths.includes(path)) {
    return NextResponse.next();
  }
  
  // For now, just allow all requests to pass through
  // In production, implement proper JWT verification
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};