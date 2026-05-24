import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import { getExpensesCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthCookie();
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;
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
    const result = await expensesCollection.updateOne(
      {
        _id: new ObjectId(id),
        userId: new ObjectId(decoded.userId),
      },
      {
        $set: {
          name,
          price: parseFloat(price),
          date: expenseDate,
          month,
          year,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Expense updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthCookie();
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;

    const expensesCollection = await getExpensesCollection();
    const result = await expensesCollection.deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(decoded.userId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Expense deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
