import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUsersCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    // Get token from request cookies (not from next/headers)
    const token = request.cookies.get('authToken')?.value;

    console.log('[v0] Auth ME endpoint - token:', token ? 'exists' : 'missing');

    if (!token) {
      console.log('[v0] Auth ME - no token, returning 401');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('[v0] Auth ME - invalid token, returning 401');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('[v0] Auth ME - token valid, userId:', decoded.userId);

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne({
      _id: new ObjectId(decoded.userId),
    });

    if (!user) {
      console.log('[v0] Auth ME - user not found, returning 404');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[v0] Auth ME - returning user data');

    return NextResponse.json(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
