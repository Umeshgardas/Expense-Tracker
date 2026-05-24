import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import { getExpensesCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Connects to a dedicated 'user_incomes' collection in your MongoDB database
async function getIncomesCollection() {
  const collectionFetch = await getExpensesCollection();
  return collectionFetch.db.collection('user_incomes');
}

// GET: Fetch all saved salary overrides for a given year
export async function GET(request: NextRequest) {
  try {
    const token = await getAuthCookie();
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');

    if (!year) {
      return NextResponse.json({ error: 'Year parameter is required' }, { status: 400 });
    }

    const incomesCollection = await getIncomesCollection();
    const records = await incomesCollection
      .find({ 
        userId: new ObjectId(decoded.userId),
        year: parseInt(year)
      })
      .toArray();

    // Reduces array data [{ month: 6, amount: 30000 }] down to a clean object state: { 6: 30000 }
    const formattedIncomes = records.reduce((acc, current) => {
      acc[current.month] = current.amount;
      return acc;
    }, {} as Record<number, number>);

    return NextResponse.json(formattedIncomes, { status: 200 });
  } catch (error) {
    console.error('Fetch incomes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Save or Update a single month's salary milestone (Using Upsert)
export async function PUT(request: NextRequest) {
  try {
    const token = await getAuthCookie();
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { year, month, amount } = await request.json();

    if (year === undefined || month === undefined || amount === undefined) {
      return NextResponse.json({ error: 'Year, month, and amount are required' }, { status: 400 });
    }

    const incomesCollection = await getIncomesCollection();

    // Overwrites or creates the document to prevent record duplicates
    await incomesCollection.updateOne(
      {
        userId: new ObjectId(decoded.userId),
        year: parseInt(year),
        month: parseInt(month)
      },
      {
        $set: {
          amount: parseFloat(amount),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ message: 'Monthly income updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Update income error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}