import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import { getExpensesCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const token = await getAuthCookie();
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { name, price, date } = await request.json();

    if (!name || !price || !date) {
      return NextResponse.json(
        { error: 'Name, price, and date are required' },
        { status: 400 }
      );
    }

    const expenseDate = new Date(date);
    const month = expenseDate.getMonth() + 1;
    const year = expenseDate.getFullYear();

    const expensesCollection = await getExpensesCollection();
    const result = await expensesCollection.insertOne({
      _id: new ObjectId(),
      userId: new ObjectId(decoded.userId),
      name,
      price: parseFloat(price),
      date: expenseDate,
      month,
      year,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        message: 'Expense created successfully',
        expenseId: result.insertedId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthCookie();
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    const expensesCollection = await getExpensesCollection();
    let query: any = { userId: new ObjectId(decoded.userId) };

    if (year) {
      query.year = parseInt(year);
    }

    if (month) {
      query.month = parseInt(month);
    }

    const expenses = await expensesCollection
      .find(query)
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json(expenses, { status: 200 });
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
