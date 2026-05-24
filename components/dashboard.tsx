'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { ExpenseForm } from './expense-form';
import { ExpenseList } from './expense-list';
import { ExpenseEditModal } from './expense-edit-modal';
import { LogOut, ChevronDown, ChevronRight, Plus } from 'lucide-react';

interface Expense {
  _id: string;
  name: string;
  price: number;
  date: string; // Expected format: YYYY-MM-DD
  month: number;
  year: number;
}

export function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Collapsible states tracking open IDs
  const [openMonths, setOpenMonths] = useState<Record<number, boolean>>({});
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({}); // Key format: "month-day"

  // Quick-add state tracking which day has an active inline form
  const [activeInlineDay, setActiveInlineDay] = useState<string | null>(null);
  const [inlineName, setInlineName] = useState('');
  const [inlinePrice, setInlinePrice] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, [selectedYear]);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/expenses?year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async (name: string, price: number, date: string) => {
    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price, date }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add expense');
    }

    await fetchExpenses();
  };

  const handleInlineSubmit = async (e: React.FormEvent, month: number, day: number) => {
    e.preventDefault();
    if (!inlineName || !inlinePrice) return;

    // Pad month and day values to guarantee valid YYYY-MM-DD strings
    const formattedMonth = String(month).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const computedDate = `${selectedYear}-${formattedMonth}-${formattedDay}`;

    try {
      await handleAddExpense(inlineName, parseFloat(inlinePrice), computedDate);
      setInlineName('');
      setInlinePrice('');
      setActiveInlineDay(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateExpense = async (id: string, name: string, price: number, date: string) => {
    const response = await fetch(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price, date }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update expense');
    }

    await fetchExpenses();
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (id: string) => {
    const response = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete expense');
    }

    await fetchExpenses();
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const toggleMonth = (month: number) => {
    setOpenMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };

  const toggleDay = (month: number, day: number) => {
    const key = `${month}-${day}`;
    setOpenDays(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper utility constants
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 26 + i);
  const months = [
    { value: 1, name: 'January' }, { value: 2, name: 'February' },
    { value: 3, name: 'March' }, { value: 4, name: 'April' },
    { value: 5, name: 'May' }, { value: 6, name: 'June' },
    { value: 7, name: 'July' }, { value: 8, name: 'August' },
    { value: 9, name: 'September' }, { value: 10, name: 'October' },
    { value: 11, name: 'November' }, { value: 12, name: 'December' }
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Expense Tracker</h1>
              <p className="text-muted-foreground text-sm mt-1">{user?.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Year Dropdown State Selector */}
        <div className="mb-8 max-w-xs">
          <label className="block text-sm font-medium mb-2">Select Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Sidebar Form Container */}
          <div className="lg:col-span-1">
            <ExpenseForm onSubmit={handleAddExpense} isLoading={isLoading} />
          </div>

          {/* Collapsible Expense Lists Area */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-6">Yearly Manifest ({selectedYear})</h2>
            
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading expenses...</div>
            ) : (
              <div className="space-y-3">
                {months.map((m) => {
                  const monthExpenses = expenses.filter(e => e.month === m.value);
                  const daysInMonth = getDaysInMonth(selectedYear, m.value);
                  const isMonthOpen = !!openMonths[m.value];

                  return (
                    <div key={m.value} className="border rounded-lg bg-card overflow-hidden">
                      {/* Month Trigger Bar */}
                      <button
                        onClick={() => toggleMonth(m.value)}
                        className="w-full px-4 py-3 flex items-center justify-between bg-muted/40 hover:bg-muted/80 transition-colors text-left"
                      >
                        <span className="font-medium flex items-center gap-2">
                          {isMonthOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          {m.name}
                        </span>
                        <span className="text-sm text-muted-foreground font-mono">
                          {monthExpenses.length} {monthExpenses.length === 1 ? 'expense' : 'expenses'}
                        </span>
                      </button>

                      {/* Month Content Block */}
                      {isMonthOpen && (
                        <div className="p-2 bg-background border-t space-y-2">
                          {Array.from({ length: daysInMonth }, (_, index) => {
                            const day = index + 1;
                            const dayKey = `${m.value}-${day}`;
                            const isDayOpen = !!openDays[dayKey];
                            
                            // Check item arrays parsing single or double digit day representations
                            const dayExpenses = monthExpenses.filter(e => {
                              const expDay = new Date(e.date).getUTCDate();
                              return expDay === day;
                            });

                            return (
                              <div key={day} className="border border-muted rounded-md overflow-hidden">
                                {/* Day Trigger Bar */}
                                <button
                                  onClick={() => toggleDay(m.value, day)}
                                  className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted/30 text-xs transition-colors"
                                >
                                  <span className="flex items-center gap-1 font-medium text-muted-foreground">
                                    {isDayOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                    Day {day}
                                  </span>
                                  <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                    {dayExpenses.length} items
                                  </span>
                                </button>

                                {/* Day Expandable Child Panel */}
                                {isDayOpen && (
                                  <div className="p-3 bg-muted/10 border-t space-y-3">
                                    {/* Traditional Expense Rendering List */}
                                    {dayExpenses.length > 0 && (
                                      <ExpenseList
                                        expenses={dayExpenses}
                                        month={m.value}
                                        onDelete={handleDeleteExpense}
                                        onEdit={setEditingExpense}
                                      />
                                    )}

                                    {/* Inline Add Action Panel */}
                                    {activeInlineDay === dayKey ? (
                                      <form
                                        onSubmit={(e) => handleInlineSubmit(e, m.value, day)}
                                        className="flex gap-2 items-center bg-card p-2 border rounded-md"
                                      >
                                        <input
                                          type="text"
                                          placeholder="Expense item name"
                                          value={inlineName}
                                          onChange={(e) => setInlineName(e.target.value)}
                                          className="flex-1 text-xs bg-transparent border-b focus:outline-none focus:border-primary p-1"
                                          required
                                        />
                                        <input
                                          type="number"
                                          placeholder="Price"
                                          value={inlinePrice}
                                          onChange={(e) => setInlinePrice(e.target.value)}
                                          className="w-20 text-xs bg-transparent border-b focus:outline-none focus:border-primary p-1"
                                          required
                                        />
                                        <Button type="submit" size="sm" className="h-7 text-xs px-2">
                                          Save
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 text-xs px-2"
                                          onClick={() => setActiveInlineDay(null)}
                                        >
                                          Cancel
                                        </Button>
                                      </form>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setActiveInlineDay(dayKey);
                                          setInlineName('');
                                          setInlinePrice('');
                                        }}
                                        className="w-full py-1.5 border border-dashed border-muted hover:border-primary/40 rounded flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                      >
                                        <Plus className="h-3 w-3" /> New Expense
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingExpense && (
        <ExpenseEditModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onUpdate={handleUpdateExpense}
        />
      )}
    </div>
  );
}