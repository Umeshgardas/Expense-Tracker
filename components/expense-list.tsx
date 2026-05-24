'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2 } from 'lucide-react';

// Unified type signature mapping directly to the dashboard interface schema
interface Expense {
  _id: string;
  name: string;
  price: number;
  date: string;
  month: number;
  year: number; // Added to resolve the TS(2322) compilation mismatch error
}

interface ExpenseListProps {
  expenses: Expense[]; // Receives pre-filtered day expenses from parent
  month: number;
  onDelete: (id: string) => Promise<void>;
  onEdit: (expense: Expense) => void;
}

export function ExpenseList({
  expenses,
  onDelete,
  onEdit,
}: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (expenses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <div
          key={expense._id}
          className="flex items-center justify-between p-2 bg-card border rounded-md hover:bg-muted/40 transition-colors text-sm"
        >
          {/* Metadata Display Column */}
          <div className="flex-1 min-w-0 pr-2">
            <p className="font-medium truncate">{expense.name}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {new Date(expense.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Pricing Column */}
          <div className="text-right mr-3 shrink-0">
            <p className="font-semibold">₹{expense.price.toFixed(2)}</p>
          </div>

          {/* Action Modifier Layout Buttons */}
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(expense)}
              disabled={deletingId !== null}
            >
              <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleDelete(expense._id)}
              disabled={deletingId !== null}
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500 hover:text-red-600" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}