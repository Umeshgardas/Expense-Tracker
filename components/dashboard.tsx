"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { ExpenseForm } from "./expense-form";
import { ExpenseList } from "./expense-list";
import { ExpenseEditModal } from "./expense-edit-modal";
import {
  LogOut,
  ChevronDown,
  ChevronRight,
  Plus,
  Wallet,
  Pencil,
  TrendingDown,
  PiggyBank,
  CalendarDays,
  Loader2,
} from "lucide-react";

interface Expense {
  _id: string;
  name: string;
  price: number;
  date: string;
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

  // Layout Mutation Loading Animation Overlay Trackers
  const [actionStatus, setActionStatus] = useState<
    "idle" | "adding" | "updating"
  >("idle");

  const [monthlyIncomes, setMonthlyIncomes] = useState<Record<number, number>>(
    {},
  );
  const [editingIncomeMonth, setEditingIncomeMonth] = useState<number | null>(
    null,
  );
  const [tempIncomeValue, setTempIncomeValue] = useState("");

  const [openMonths, setOpenMonths] = useState<Record<number, boolean>>({});
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [activeInlineDay, setActiveInlineDay] = useState<string | null>(null);
  const [inlineName, setInlineName] = useState("");
  const [inlinePrice, setInlinePrice] = useState("");

  const monthRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const today = new Date();
  const currentRealYear = today.getFullYear();
  const currentRealMonth = today.getMonth() + 1;

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([fetchExpenses(), fetchMonthlyIncomes()]);
      } catch (error) {
        console.error("Error synchronizing dashboard metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedYear]);

  useEffect(() => {
    if (!isLoading && expenses.length >= 0) {
      const nativeMonth = today.getMonth() + 1;
      const nativeDay = today.getDate();
      const targetDayKey = `${nativeMonth}-${nativeDay}`;

      if (selectedYear === currentRealYear) {
        setOpenMonths((prev) => ({ ...prev, [nativeMonth]: true }));
        setOpenDays((prev) => ({ ...prev, [targetDayKey]: true }));

        const scrollTimeout = setTimeout(() => {
          const targetDayElement = dayRefs.current[targetDayKey];
          if (targetDayElement) {
            targetDayElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          } else {
            monthRefs.current[nativeMonth]?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 300);

        return () => clearTimeout(scrollTimeout);
      }
    }
  }, [isLoading, selectedYear, expenses]);

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`/api/expenses?year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    }
  };

  const fetchMonthlyIncomes = async () => {
    try {
      const response = await fetch(`/api/income?year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setMonthlyIncomes(data);
      }
    } catch (error) {
      console.error("Failed to fetch monthly custom incomes:", error);
    }
  };

  const handleAddExpense = async (
    name: string,
    price: number,
    date: string,
  ) => {
    try {
      setActionStatus("adding");
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, date }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add expense");
      }

      await fetchExpenses();
      setIsFormOpen(false);
    } finally {
      setActionStatus("idle");
    }
  };

  const handleInlineSubmit = async (
    e: React.FormEvent,
    month: number,
    day: number,
  ) => {
    e.preventDefault();
    if (!inlineName || !inlinePrice) return;

    const formattedMonth = String(month).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const computedDate = `${selectedYear}-${formattedMonth}-${formattedDay}`;

    try {
      await handleAddExpense(inlineName, parseFloat(inlinePrice), computedDate);
      setInlineName("");
      setInlinePrice("");
      setActiveInlineDay(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateExpense = async (
    id: string,
    name: string,
    price: number,
    date: string,
  ) => {
    try {
      setActionStatus("updating");
      const response = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, date }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update expense");
      }

      await fetchExpenses();
      setEditingExpense(null);
    } finally {
      setActionStatus("idle");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const response = await fetch(`/api/expenses/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete expense");
    }

    await fetchExpenses();
  };

  const handleSaveIncome = async (month: number) => {
    const parsed = parseFloat(tempIncomeValue);
    if (isNaN(parsed)) return;

    const previousIncomes = { ...monthlyIncomes };

    try {
      setMonthlyIncomes((prev) => ({ ...prev, [month]: parsed }));
      setEditingIncomeMonth(null);

      const response = await fetch("/api/income", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: selectedYear,
          month: month,
          amount: parsed,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save income adjustments");
      }
    } catch (error) {
      console.error("Database sync failure, rolling back state:", error);
      setMonthlyIncomes(previousIncomes);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const toggleMonth = (month: number) => {
    const isFutureMonth =
      selectedYear > currentRealYear ||
      (selectedYear === currentRealYear && month > currentRealMonth);
    if (isFutureMonth) return;

    setOpenMonths((prev) => ({ ...prev, [month]: !prev[month] }));
  };

  const toggleDay = (month: number, day: number) => {
    const key = `${month}-${day}`;
    setOpenDays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const years = Array.from(
    { length: 100 },
    (_, i) => new Date().getFullYear() - 26 + i,
  );
  const months = [
    { value: 1, name: "January" },
    { value: 2, name: "February" },
    { value: 3, name: "March" },
    { value: 4, name: "April" },
    { value: 5, name: "May" },
    { value: 6, name: "June" },
    { value: 7, name: "July" },
    { value: 8, name: "August" },
    { value: 9, name: "September" },
    { value: 10, name: "October" },
    { value: 11, name: "November" },
    { value: 12, name: "December" },
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // Helper function to extract 3-letter weekday label cleanly
  const getDayOfWeekLabel = (year: number, month: number, day: number) => {
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString("en-US", { weekday: "short" }); // Returns 'Fri', 'Sat', etc.
  };

  const resolvedMonthlyIncomes: Record<number, number> = {};
  let currentActiveRunningSalaryBaseline = 20000;

  for (let m = 1; m <= 12; m++) {
    if (monthlyIncomes[m] !== undefined) {
      currentActiveRunningSalaryBaseline = monthlyIncomes[m];
    }
    resolvedMonthlyIncomes[m] = currentActiveRunningSalaryBaseline;
  }

  const yearlyTotalIncome = Object.entries(resolvedMonthlyIncomes).reduce(
    (sum, [monthStr, val]) => {
      const mNum = parseInt(monthStr);
      const isFuture =
        selectedYear > currentRealYear ||
        (selectedYear === currentRealYear && mNum > currentRealMonth);
      return isFuture ? sum : sum + val;
    },
    0,
  );

  const yearlyTotalSpend = expenses.reduce((sum, item) => {
    const isFuture =
      item.year > currentRealYear ||
      (item.year === currentRealYear && item.month > currentRealMonth);
    return isFuture ? sum : sum + (item.price || 0);
  }, 0);

  const yearlyTotalSavings = yearlyTotalIncome - yearlyTotalSpend;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold truncate">
                Expense Tracker
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1 truncate max-w-[180px] sm:max-w-none">
                {user?.email}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              size="sm"
              className="shrink-0"
            >
              <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Year Dropdown Selector */}
        <div className="mb-8 max-w-xs">
          <label className="block text-sm font-medium mb-2">Select Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Collapsible Sidebar Form Container */}
          <div className="lg:col-span-1 border rounded-lg bg-card overflow-hidden shadow-sm">
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="w-full px-4 py-3 flex items-center justify-between bg-muted/20 hover:bg-muted/50 transition-colors font-medium text-sm"
            >
              <span className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                Add New Expense
              </span>
              {isFormOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {isFormOpen && (
              <div className="p-4 border-t bg-background animate-in fade-in slide-in-from-top-2 duration-150">
                <ExpenseForm
                  onSubmit={handleAddExpense}
                  isLoading={actionStatus === "adding"}
                />
              </div>
            )}
          </div>

          {/* Collapsible Expense Lists Area */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-6">
              Yearly Manifest ({selectedYear})
            </h2>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading expenses...
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  let continuousCumulativeYearlyBalance = 0;

                  return months.map((m) => {
                    const isFutureMonth =
                      selectedYear > currentRealYear ||
                      (selectedYear === currentRealYear &&
                        m.value > currentRealMonth);

                    const monthExpenses = expenses.filter(
                      (e) => e.month === m.value,
                    );
                    const daysInMonth = getDaysInMonth(selectedYear, m.value);
                    const isMonthOpen = !isFutureMonth && !!openMonths[m.value];

                    const baseIncome = resolvedMonthlyIncomes[m.value];
                    const totalMonthValue = monthExpenses.reduce(
                      (sum, item) => sum + (item.price || 0),
                      0,
                    );
                    const remainingMonthValue = baseIncome - totalMonthValue;

                    if (!isFutureMonth) {
                      continuousCumulativeYearlyBalance += baseIncome;
                    }

                    let dayLevelRollingBase = continuousCumulativeYearlyBalance;
                    continuousCumulativeYearlyBalance -= totalMonthValue;

                    return (
                      <div
                        key={m.value}
                        ref={(el) => {
                          monthRefs.current[m.value] = el;
                        }}
                        className={`border rounded-lg bg-card overflow-hidden scroll-mt-24 shadow-sm transition-opacity ${
                          isFutureMonth ? "opacity-50 select-none" : ""
                        }`}
                      >
                        {/* Responsive Month Trigger Bar */}
                        <div className="w-full px-2.5 sm:px-4 py-3 flex items-center justify-between bg-muted/40 border-b flex-nowrap overflow-hidden gap-1.5 sm:gap-2">
                          <button
                            onClick={() => toggleMonth(m.value)}
                            disabled={isFutureMonth}
                            className={`flex items-center gap-1 sm:gap-2 text-left font-medium text-xs sm:text-base min-w-0 flex-1 truncate ${
                              isFutureMonth ? "cursor-not-allowed" : ""
                            }`}
                          >
                            {!isFutureMonth &&
                              (isMonthOpen ? (
                                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                              ))}
                            <span className="truncate">{m.name}</span>
                          </button>

                          {/* Financial Context Labels */}
                          {!isFutureMonth && (
                            <div className="flex items-center gap-1.5 sm:gap-3 text-[11px] sm:text-xs shrink-0 flex-nowrap">
                              {editingIncomeMonth === m.value ? (
                                <div className="flex items-center bg-background border rounded px-1.5 py-0.5 h-7 sm:h-auto">
                                  <span className="text-muted-foreground font-mono mr-0.5">
                                    ₹
                                  </span>
                                  <input
                                    type="number"
                                    value={tempIncomeValue}
                                    onChange={(e) =>
                                      setTempIncomeValue(e.target.value)
                                    }
                                    className="w-12 sm:w-16 bg-transparent outline-none font-mono font-semibold text-emerald-600 text-xs"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        handleSaveIncome(m.value);
                                      if (e.key === "Escape")
                                        setEditingIncomeMonth(null);
                                    }}
                                  />
                                  <button
                                    onClick={() => handleSaveIncome(m.value)}
                                    className="text-[9px] sm:text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded ml-1"
                                  >
                                    Save
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => {
                                    setEditingIncomeMonth(m.value);
                                    setTempIncomeValue(baseIncome.toString());
                                  }}
                                  className="flex items-center gap-1 cursor-pointer bg-background hover:bg-muted/80 border px-1.5 sm:px-2 py-1 rounded group transition-colors select-none"
                                >
                                  {/* Subtle Indicator Section */}
                                  <div className="flex items-center gap-1">
                                    {monthlyIncomes[m.value] !== undefined && (
                                      <span className="relative flex h-2 w-2 mr-0.5">
                                        {/* Optional: Remove the next line if you don't want the dot to pulse/blink */}
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                      </span>
                                    )}
                                    <span className="text-muted-foreground font-mono">
                                      Income:
                                    </span>
                                  </div>

                                  <span className="font-semibold text-emerald-600 font-mono flex items-center">
                                    ₹
                                    <span className="inline sm:hidden">
                                      {baseIncome.toFixed(0)}
                                    </span>
                                    <span className="hidden sm:inline">
                                      {baseIncome}
                                    </span>
                                  </span>
                                  <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground opacity-40 sm:opacity-0 sm:group-hover:opacity-100 ml-0.5 shrink-0" />
                                </div>
                              )}

                              <div className="flex items-center gap-0.5 sm:gap-1 bg-background border px-1.5 sm:px-2 py-1 rounded">
                                <span className="text-muted-foreground">
                                  Remaining:
                                </span>
                                <span
                                  className={`font-bold font-mono ${remainingMonthValue >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                                >
                                  ₹
                                  <span className="inline sm:hidden">
                                    {remainingMonthValue.toFixed(0)}
                                  </span>
                                  <span className="hidden sm:inline">
                                    {remainingMonthValue.toFixed(2)}
                                  </span>
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Month Content Block */}
                        {!isFutureMonth && isMonthOpen && (
                          <div className="p-1 sm:p-2 bg-background space-y-2 animate-in fade-in duration-200">
                            {Array.from({ length: daysInMonth }, (_, index) => {
                              const day = index + 1;
                              const dayKey = `${m.value}-${day}`;
                              const isDayOpen = !!openDays[dayKey];

                              const dayExpenses = monthExpenses.filter((e) => {
                                const expDay = new Date(e.date).getUTCDate();
                                return expDay === day;
                              });

                              const totalDayValue = dayExpenses.reduce(
                                (sum, item) => sum + (item.price || 0),
                                0,
                              );

                              dayLevelRollingBase -= totalDayValue;
                              const currentDayRemaining = dayLevelRollingBase;

                              // Calculate Dynamic Day Label Structure
                              const dayName = getDayOfWeekLabel(
                                selectedYear,
                                m.value,
                                day,
                              );

                              return (
                                <div
                                  key={day}
                                  ref={(el) => {
                                    dayRefs.current[dayKey] = el;
                                  }}
                                  className="border border-muted rounded-md overflow-hidden scroll-mt-28"
                                >
                                  {/* Responsive Day Row Trigger Bar */}
                                  <button
                                    onClick={() => toggleDay(m.value, day)}
                                    className="w-full px-2 sm:px-3 py-2 flex items-center justify-between hover:bg-muted/30 text-xs transition-colors flex-nowrap overflow-hidden gap-1"
                                  >
                                    <span className="flex items-center gap-1 font-medium text-muted-foreground shrink-0">
                                      {isDayOpen ? (
                                        <ChevronDown className="h-3 w-3 shrink-0" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 shrink-0" />
                                      )}
                                      Day {day}{" "}
                                      <span className="text-[10px] text-muted-foreground/70 font-mono lowercase">
                                        [{dayName}]
                                      </span>
                                    </span>
                                    <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 justify-end flex-1 flex-nowrap overflow-hidden">
                                      {totalDayValue > 0 && (
                                        <span className="font-medium text-rose-500 font-mono text-[10px] sm:text-xs shrink-0">
                                          -₹
                                          <span className="inline sm:hidden">
                                            {totalDayValue.toFixed(0)}
                                          </span>
                                          <span className="hidden sm:inline">
                                            {totalDayValue.toFixed(2)}
                                          </span>
                                        </span>
                                      )}
                                      <div className="text-[10px] sm:text-[11px] font-mono border-l pl-1.5 flex gap-0.5 shrink-0 items-center">
                                        <span className="text-muted-foreground text-[9px] sm:text-[10px]">
                                          Bal:
                                        </span>
                                        <span
                                          className={
                                            currentDayRemaining >= 0
                                              ? "text-emerald-600 font-semibold"
                                              : "text-rose-600 font-semibold"
                                          }
                                        >
                                          ₹
                                          <span className="inline sm:hidden">
                                            {currentDayRemaining.toFixed(0)}
                                          </span>
                                          <span className="hidden sm:inline">
                                            {currentDayRemaining.toFixed(2)}
                                          </span>
                                        </span>
                                      </div>
                                      <span className="text-[9px] font-mono bg-muted px-1 py-0.5 rounded text-muted-foreground shrink-0">
                                        {dayExpenses.length}{" "}
                                        <span className="hidden sm:inline">
                                          items
                                        </span>
                                      </span>
                                    </div>
                                  </button>

                                  {/* Day Expandable Child Panel */}
                                  {isDayOpen && (
                                    <div className="p-2 sm:p-3 bg-muted/10 border-t space-y-3 overflow-hidden animate-in fade-in duration-150">
                                      {dayExpenses.length > 0 && (
                                        <ExpenseList
                                          expenses={dayExpenses}
                                          month={m.value}
                                          onDelete={handleDeleteExpense}
                                          onEdit={setEditingExpense}
                                        />
                                      )}

                                      {/* Responsive Forms Inline Block */}
                                      {activeInlineDay === dayKey ? (
                                        <form
                                          onSubmit={(e) =>
                                            handleInlineSubmit(e, m.value, day)
                                          }
                                          className="flex flex-row gap-1.5 sm:gap-2 items-center bg-card p-1.5 sm:p-2 border rounded-md shadow-inner w-full flex-nowrap overflow-hidden animate-in zoom-in-95 duration-150"
                                        >
                                          <input
                                            type="text"
                                            placeholder="Expense item name"
                                            value={inlineName}
                                            onChange={(e) =>
                                              setInlineName(e.target.value)
                                            }
                                            className="flex-1 min-w-[60px] text-xs bg-transparent border-b focus:outline-none focus:border-primary py-0.5 px-1 truncate"
                                            required
                                          />
                                          <div className="flex items-center gap-0.5 border-b focus-within:border-primary px-0.5 w-14 sm:w-20 shrink-0">
                                            <span className="text-xs text-muted-foreground font-mono">
                                              ₹
                                            </span>
                                            <input
                                              type="number"
                                              placeholder="Price"
                                              value={inlinePrice}
                                              onChange={(e) =>
                                                setInlinePrice(e.target.value)
                                              }
                                              className="w-full text-xs bg-transparent focus:outline-none py-0.5"
                                              required
                                            />
                                          </div>
                                          <div className="flex gap-0.5 shrink-0">
                                            <Button
                                              type="submit"
                                              size="sm"
                                              className="h-7 text-[10px] sm:text-xs px-1.5 sm:px-2"
                                            >
                                              Save
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 text-[10px] sm:text-xs px-1"
                                              onClick={() =>
                                                setActiveInlineDay(null)
                                              }
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        </form>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setActiveInlineDay(dayKey);
                                            setInlineName("");
                                            setInlinePrice("");
                                          }}
                                          className="w-full py-1.5 border border-dashed border-muted hover:border-primary/40 rounded flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors bg-background"
                                        >
                                          <Plus className="h-3 w-3" /> New
                                          Expense
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
                  });
                })()}

                {/* GLOBAL YEARLY METRICS FOOTER CARD */}
                <div className="mt-6 border-2 border-primary/20 rounded-xl bg-card p-5 shadow-md overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                    <CalendarDays className="h-24 w-24 text-primary" />
                  </div>

                  <h3 className="text-base font-bold text-card-foreground mb-4 flex items-center gap-2 border-b pb-2">
                    📊 Financial Summary Overview — {selectedYear}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-muted/30 p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        Total Income Allocations
                      </p>
                      <p className="text-xl font-bold font-mono text-emerald-600 mt-1">
                        ₹{yearlyTotalIncome.toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-lg border flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                          <TrendingDown className="h-3 w-3 text-rose-500" />{" "}
                          Total Annual Outflow
                        </p>
                        <p className="text-xl font-bold font-mono text-rose-500 mt-1">
                          -₹{yearlyTotalSpend.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-lg border flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                          <PiggyBank className="h-3 w-3 text-cyan-600" /> Total
                          Net Accumulations
                        </p>
                        <p
                          className={`text-xl font-bold font-mono mt-1 ${yearlyTotalSavings >= 0 ? "text-cyan-600" : "text-rose-600"}`}
                        >
                          ₹{yearlyTotalSavings.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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

      {/* FLOATING ACTION STATUS SYSTEM NOTIFICATION LAYER */}
      {actionStatus !== "idle" && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-neutral-900 text-neutral-50 dark:bg-neutral-50 dark:text-neutral-900 px-4 py-3 rounded-xl shadow-2xl border border-neutral-800 text-xs font-semibold tracking-wide shadow-black/20 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>
            {actionStatus === "adding"
              ? "Adding new transaction records..."
              : "Updating changes to dashboard manifest..."}
          </span>
        </div>
      )}
    </div>
  );
}
