// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // Edge-compatible library

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// jose requires secrets to be encoded as a Uint8Array
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

async function verifyTokenMiddleware(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as { userId: string };
  } catch (error) {
    console.error('[Middleware] JWT verification failed:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('authToken')?.value;

  // Allow public routes
  if (pathname === '/login' || pathname === '/register' || pathname === '/') {
    return NextResponse.next();
  }

  // Protect dashboard route
  if (pathname.startsWith('/dashboard')) {
    console.log('[v0] Middleware - Dashboard access, token:', token ? 'exists' : 'missing');

    if (!token) {
      console.log('[v0] Middleware - No token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Await the Edge-friendly validation
    const decoded = await verifyTokenMiddleware(token);
    if (!decoded) {
      console.log('[v0] Middleware - Invalid token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    console.log('[v0] Middleware - Token valid, allowing dashboard access');
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // Added a negative lookahead matcher to ignore Next.js internal files, static files, and images
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};