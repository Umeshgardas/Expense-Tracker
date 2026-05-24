'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Loader2 } from 'lucide-react';

interface Expense {
  _id: string;
  name: string;
  price: number;
  date: string;
  month: number;
  year: number;
}

interface ExpenseListProps {
  expenses: Expense[];
  month: number;
  onDelete: (id: string) => Promise<void>;
  onEdit: (expense: Expense) => void;
}

export function ExpenseList({ expenses, month, onDelete, onEdit }: ExpenseListProps) {
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setIsDeletingId(id);
      await onDelete(id);
    } catch (error) {
      console.error('Failed to complete item removal sequence:', error);
      setIsDeletingId(null);
    }
  };

  const handleItemTextClick = (id: string) => {
    setExpandedItemId(prev => (prev === id ? null : id));
  };

  if (!expenses || expenses.length === 0) return null;

  return (
    <div className="w-full space-y-1.5 animate-in fade-in duration-200">
      {expenses.map((expense) => {
        const isExpanded = expandedItemId === expense._id;
        const isDeleting = isDeletingId === expense._id;
        const formattedDay = new Date(expense.date).getUTCDate();
        const rawMonthName = new Date(expense.date).toLocaleString('default', { month: 'short' });

        return (
          <div
            key={expense._id}
            className={`flex items-center justify-between p-2 sm:p-3 bg-card border rounded-lg shadow-sm gap-2 w-full transition-all duration-300 relative overflow-hidden
              ${isDeleting ? 'opacity-60 bg-destructive/5 border-destructive/20 scale-[0.99]' : ''}
            `}
          >
            {/* INLINE STATUS ANIMATION OVERLAY */}
            {isDeleting && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 duration-150 z-10">
                <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                <span className="text-xs font-semibold text-destructive tracking-wide animate-pulse">
                  Deleting...
                </span>
              </div>
            )}

            {/* Left Content Column */}
            <div className="flex flex-col min-w-0 flex-1 justify-center">
              <span
                onClick={() => handleItemTextClick(expense._id)}
                className={`text-xs sm:text-sm font-medium text-card-foreground cursor-pointer select-none outline-none transition-all duration-150
                  ${isExpanded 
                    ? 'whitespace-normal break-words overflow-visible' 
                    : 'truncate max-w-[130px] xs:max-w-[170px] sm:max-w-none'
                  } 
                  md:hover:whitespace-normal md:hover:overflow-visible md:hover:break-words`
                }
                title="Click to toggle full text view"
              >
                {expense.name}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
                {rawMonthName} {formattedDay}
              </span>
            </div>

            {/* Right Action Controls Column */}
            <div className="flex items-center gap-1 sm:gap-3 shrink-0 pl-1">
              <span className="font-mono font-semibold text-xs sm:text-sm text-foreground whitespace-nowrap">
                ₹<span className="inline sm:hidden">{expense.price.toFixed(0)}</span>
                <span className="hidden sm:inline">{expense.price.toFixed(2)}</span>
              </span>

              {/* Action Buttons */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isDeleting}
                  onClick={() => onEdit(expense)}
                  className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="sr-only">Edit item</span>
                </Button>
                
                {/* Updated Delete Button to Theme Red */}
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isDeleting}
                  onClick={() => handleDelete(expense._id)}
                  className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete item</span>
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}