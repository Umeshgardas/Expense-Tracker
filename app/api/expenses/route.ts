import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import { getExpensesCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Define the default recurring keywords (keep them lowercase for matching)
const DEFAULT_EXP_EVERY_MONTH = [
  'electricity', 'power', 'bill',
  'emi', 'loan', 'mortgage',
  'gas', 'cylinder',
  'rent', 'maintenance',
  'wifi', 'broadband', 'internet',
  'subscription', 'netflix', 'spotify', 'prime', 'youtube',
  'insurance', 'policy',
  'milk', 'maid', 'paper'
];
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
    const startMonth = expenseDate.getMonth() + 1; // 1 to 12
    const targetYear = expenseDate.getFullYear();
    const targetDay = expenseDate.getDate();

    // Check for case-insensitive keyword match
    const normalizedName = name.trim().toLowerCase();
    const isRecurring = DEFAULT_EXP_EVERY_MONTH.some(keyword => normalizedName.includes(keyword));

    const expensesCollection = await getExpensesCollection();
    const userIdObj = new ObjectId(decoded.userId);
    const rightNow = new Date();

    let result;
    
    if (isRecurring) {
      // Build an array of expense records running from the current month until December
      const recurringExpenses = [];

      for (let m = startMonth; m <= 12; m++) {
        // Construct a clean, isolated Date instance for each progressive month
        // Months are 0-indexed in native JS dates (m - 1)
        const progressiveDate = new Date(Date.UTC(targetYear, m - 1, targetDay));

        recurringExpenses.push({
          _id: new ObjectId(),
          userId: userIdObj,
          name: name.trim(), // Keeps the original mixed case user formatting intact
          price: parseFloat(price),
          date: progressiveDate,
          month: m,
          year: targetYear,
          createdAt: rightNow,
        });
      }

      // Batch insert all remaining months into MongoDB at once
      result = await expensesCollection.insertMany(recurringExpenses);
      
      return NextResponse.json(
        {
          message: `Recurring expense added successfully across ${13 - startMonth} months.`,
          insertedCount: result.insertedCount,
        },
        { status: 201 }
      );
    } else {
      // Process a traditional, non-repeating individual transaction item
      result = await expensesCollection.insertOne({
        _id: new ObjectId(),
        userId: userIdObj,
        name: name.trim(),
        price: parseFloat(price),
        date: expenseDate,
        month: startMonth,
        year: targetYear,
        createdAt: rightNow,
      });

      return NextResponse.json(
        {
          message: 'Expense created successfully',
          expenseId: result.insertedId,
        },
        { status: 201 }
      );
    }
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