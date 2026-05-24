'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface Expense {
  _id: string;
  name: string;
  price: number;
  date: string;
}

interface ExpenseEditModalProps {
  expense: Expense;
  onClose: () => void;
  onUpdate: (id: string, name: string, price: number, date: string) => Promise<void>;
}

export function ExpenseEditModal({
  expense,
  onClose,
  onUpdate,
}: ExpenseEditModalProps) {
  const [name, setName] = useState(expense.name);
  const [price, setPrice] = useState(expense.price.toString());
  const [date, setDate] = useState(new Date(expense.date).toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Expense name is required');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    setIsLoading(true);

    try {
      await onUpdate(expense._id, name, parseFloat(price), date);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update expense');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Edit Expense</CardTitle>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Expense Name</label>
              <Input
                type="text"
                placeholder="e.g., Groceries, Gas, Dinner"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Price</label>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Expense'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
