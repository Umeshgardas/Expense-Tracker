import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authToken = request.cookies.get('authToken')?.value;
  
  console.log('[v0] Cookie test endpoint - authToken:', authToken ? 'exists' : 'missing');
  console.log('[v0] All cookies:', request.cookies.getAll());

  return NextResponse.json({
    authToken: authToken ? 'exists' : 'missing',
    allCookies: request.cookies.getAll(),
  });
}
