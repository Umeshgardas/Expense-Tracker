'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ExpenseFormProps {
  onSubmit: (name: string, price: number, date: string) => Promise<void>;
  isLoading?: boolean;
}

export function ExpenseForm({ onSubmit, isLoading = false }: ExpenseFormProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);

    try {
      await onSubmit(name, parseFloat(price), date);
      setName('');
      setPrice('');
      setDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Expense</CardTitle>
        <CardDescription>Record a new expense</CardDescription>
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
              disabled={isSubmitting || isLoading}
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
              disabled={isSubmitting || isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSubmitting || isLoading}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? 'Adding...' : 'Add Expense'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
