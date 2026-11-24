import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '@/api/client';
import type { Event } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  DollarSign,
  PieChart as PieIcon,
  TrendingUp,
  AlertTriangle,
  Plus,
  Settings,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Trash2,
} from 'lucide-react';

interface ExpenseCategoryItem {
  category: string;
  allocatedAmount: number;
}

interface ActualExpenseItem {
  _id?: string;
  id?: string;
  title: string;
  amount: number;
  category: string;
  recordedAt?: string;
}

interface BudgetData {
  _id?: string;
  id?: string;
  eventId: string;
  totalBudget: number;
  expenseCategories: ExpenseCategoryItem[];
  actualExpenses: ActualExpenseItem[];
}

export const BudgetManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlEventId = searchParams.get('eventId') || '';

  // Events list & Selection
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(urlEventId);
  const [, setIsLoadingEvents] = useState(false);

  // Budget Data State
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [totalActualSpent, setTotalActualSpent] = useState<number>(0);
  const [remainingBudget, setRemainingBudget] = useState<number>(0);
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  // Configure Budget Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configTotal, setConfigTotal] = useState<number>(50000);
  const [configCategories, setConfigCategories] = useState<ExpenseCategoryItem[]>([
    { category: 'Venue & Facilities', allocatedAmount: 20000 },
    { category: 'Catering & Refreshments', allocatedAmount: 15000 },
    { category: 'AV & Technical Production', allocatedAmount: 10000 },
    { category: 'Contingency & Buffer', allocatedAmount: 5000 },
  ]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // Log Actual Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCategory, setExpenseCategory] = useState('Venue & Facilities');
  const [isLoggingExpense, setIsLoggingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);

  // Ledger Filter
  const [ledgerSearch, setLedgerSearch] = useState('');

  // 1. Fetch Organizer Events
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const res = await apiClient.get('/events', { params: { limit: 50 } });
        const list: Event[] = res.data?.data?.events || [];
        setEvents(list);
        if (list.length > 0 && !selectedEventId) {
          const defaultId = list[0]._id || list[0].id || '';
          setSelectedEventId(defaultId);
          setSearchParams({ eventId: defaultId });
        }
      } catch (err) {
        console.error('Failed to load events for budget', err);
      } finally {
        setIsLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  // 2. Fetch Budget for Selected Event
  const fetchBudget = useCallback(async () => {
    if (!selectedEventId) return;
    setIsLoadingBudget(true);
    setBudgetError(null);
    try {
      const res = await apiClient.get(`/events/${selectedEventId}/budget`);
      const data = res.data?.data;
      if (data?.budget) {
        setBudget(data.budget);
        setTotalActualSpent(data.totalActualSpent || 0);
        setRemainingBudget(data.remainingBudget ?? (data.budget.totalBudget - (data.totalActualSpent || 0)));
      } else {
        setBudget(null);
        setTotalActualSpent(0);
        setRemainingBudget(0);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setBudgetError(e.response?.data?.message || 'Failed to fetch budget details');
    } finally {
      setIsLoadingBudget(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  // Handle Event Selector Change
  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    setSearchParams({ eventId: id });
  };

  // Open Configure Modal and prefill existing budget
  const handleOpenConfigModal = () => {
    if (budget) {
      setConfigTotal(budget.totalBudget || 50000);
      if (budget.expenseCategories && budget.expenseCategories.length > 0) {
        setConfigCategories(
          budget.expenseCategories.map((c) => ({
            category: c.category,
            allocatedAmount: c.allocatedAmount,
          }))
        );
      }
    }
    setConfigError(null);
    setIsConfigModalOpen(true);
  };

  // Save Configured Budget (POST /events/budget)
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    if (configTotal <= 0) {
      setConfigError('Total budget must be greater than zero.');
      return;
    }

    setIsSavingConfig(true);
    setConfigError(null);
    try {
      await apiClient.post(`/events/${selectedEventId}/budget`, {
        eventId: selectedEventId,
        totalBudget: Number(configTotal),
        expenseCategories: configCategories,
      });

      setIsConfigModalOpen(false);
      await fetchBudget();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setConfigError(e.response?.data?.message || 'Failed to save budget settings');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Log Actual Expense (POST /events/budget/expense)
  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    if (!expenseTitle.trim()) {
      setExpenseError('Expense description is required.');
      return;
    }
    if (expenseAmount <= 0) {
      setExpenseError('Amount must be positive.');
      return;
    }

    setIsLoggingExpense(true);
    setExpenseError(null);
    try {
      await apiClient.post(`/events/${selectedEventId}/budget/expenses`, {
        eventId: selectedEventId,
        title: expenseTitle.trim(),
        amount: Number(expenseAmount),
        category: expenseCategory,
      });

      setIsExpenseModalOpen(false);
      setExpenseTitle('');
      setExpenseAmount(0);
      await fetchBudget();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setExpenseError(e.response?.data?.message || 'Failed to log expense');
    } finally {
      setIsLoggingExpense(false);
    }
  };

  // KPI Calculations
  const totalBudget = budget?.totalBudget || 0;
  const utilizationPct = totalBudget > 0 ? Math.round((totalActualSpent / totalBudget) * 100) : 0;
  const isOverBudget = totalActualSpent > totalBudget && totalBudget > 0;
  const isNearLimit = utilizationPct >= 80 && !isOverBudget;

  const selectedEvent = events.find((ev) => (ev._id || ev.id) === selectedEventId);

  // Group actual expenses by category
  const expensesByCategory: Record<string, number> = {};
  if (budget?.actualExpenses) {
    budget.actualExpenses.forEach((exp) => {
      const cat = exp.category || 'General';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + exp.amount;
    });
  }

  // Filtered Ledger Table
  const filteredLedger = (budget?.actualExpenses || []).filter((exp) => {
    return (
      ledgerSearch.trim() === '' ||
      exp.title.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      exp.category.toLowerCase().includes(ledgerSearch.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Event Selector Dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-200 border border-cream-300 text-navy-800 text-xs font-bold uppercase tracking-wider mb-2">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Financials & Cost Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            Event Budget & Expense Tracker
          </h1>
          <p className="text-xs sm:text-sm text-navy-600 mt-1">
            Track planned budget thresholds vs actual logged expenses with automatic overage alerts.
          </p>
        </div>

        {/* Event Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-64">
            <select
              value={selectedEventId}
              onChange={(e) => handleSelectEvent(e.target.value)}
              className="w-full text-xs font-bold py-2 px-3 rounded-xl bg-cream-50 border border-cream-300 text-navy-950 focus:outline-none focus:border-coral-500 shadow-xs"
            >
              {events.map((ev) => {
                const eid = ev._id || ev.id || '';
                return (
                  <option key={eid} value={eid}>
                    {ev.title} ({ev.status})
                  </option>
                );
              })}
            </select>
          </div>

          <Button
            variant="cream"
            size="sm"
            onClick={handleOpenConfigModal}
            leftIcon={<Settings className="w-3.5 h-3.5 text-navy-700" />}
          >
            Configure Budget
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setExpenseError(null);
              setIsExpenseModalOpen(true);
            }}
            disabled={!budget}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Log Actual Expense
          </Button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {budgetError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{budgetError}</span>
        </div>
      )}

      {/* Warning Alert Banner for Overage or 80%+ Utilization */}
      {isOverBudget && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-rose-950">Over Budget Threshold Warning!</h4>
              <p className="text-rose-700 text-xs mt-0.5">
                Total actual expenses (₹{totalActualSpent.toLocaleString('en-IN')}) have exceeded the planned budget (₹{totalBudget.toLocaleString('en-IN')}) by ₹{(totalActualSpent - totalBudget).toLocaleString('en-IN')} ({utilizationPct}% utilization).
              </p>
            </div>
          </div>
          <Badge variant="danger" size="sm">
            Critical
          </Badge>
        </div>
      )}

      {isNearLimit && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-950">Budget Nearing Capacity</h4>
              <p className="text-amber-800 text-xs mt-0.5">
                Utilization is at {utilizationPct}%. You have ₹{remainingBudget.toLocaleString('en-IN')} remaining before exceeding threshold.
              </p>
            </div>
          </div>
          <Badge variant="warning" size="sm">
            {utilizationPct}% Used
          </Badge>
        </div>
      )}

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Total Allocated */}
        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-600 block">
            Total Allocated Budget
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-navy-950">
              ₹{totalBudget.toLocaleString('en-IN')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-950 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-navy-500 mt-1">Planned cap for event</p>
        </Card>

        {/* KPI 2: Actual Spent */}
        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-coral-600 block">
            Actual Spent
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-coral-600">
              ₹{totalActualSpent.toLocaleString('en-IN')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-coral-100 text-coral-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-coral-500 mt-1">
            {budget?.actualExpenses?.length || 0} recorded items
          </p>
        </Card>

        {/* KPI 3: Remaining Balance */}
        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
            Remaining Balance
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl sm:text-3xl font-black ${isOverBudget ? 'text-rose-600' : 'text-emerald-700'}`}>
              ₹{remainingBudget.toLocaleString('en-IN')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">
            {isOverBudget ? 'Deficit amount' : 'Unspent contingency'}
          </p>
        </Card>

        {/* KPI 4: Utilization % */}
        <Card variant="cream" className="p-5 border border-cream-300">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-600 block">
            Utilization Rate
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-navy-950">
              {utilizationPct}%
            </span>
            <div className="w-8 h-8 rounded-lg bg-cream-200 text-navy-800 flex items-center justify-center">
              <PieIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full bg-cream-200 overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverBudget ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(utilizationPct, 100)}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Main Budget Grid: Categories Allocation + Ledger */}
      {!budget && !isLoadingBudget ? (
        <EmptyState
          icon={<DollarSign className="w-6 h-6 text-coral-500" />}
          title="No budget configured for this event"
          description="Set up your total planned budget and allocate category caps to monitor vendor expenses."
          actionLabel="Configure Budget Now"
          onAction={handleOpenConfigModal}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Category Progress Cards (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-coral-500" />
                <span>Category Caps vs Actual</span>
              </h3>
              <Badge variant="navy" size="sm">
                {budget?.expenseCategories?.length || 0} Categories
              </Badge>
            </div>

            <div className="space-y-3">
              {(budget?.expenseCategories || []).map((cat, idx) => {
                const spent = expensesByCategory[cat.category] || 0;
                const cap = cat.allocatedAmount || 1;
                const pct = Math.round((spent / cap) * 100);
                const isCatOver = spent > cap;

                return (
                  <Card key={idx} variant="cream" className="p-4 border border-cream-300 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-navy-950">{cat.category}</span>
                      <span className="font-semibold text-navy-700">
                        ₹{spent.toLocaleString('en-IN')} /{' '}
                        <strong className="text-navy-950">₹{cap.toLocaleString('en-IN')}</strong>
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-cream-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCatOver ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-navy-500">
                      <span>{pct}% utilized</span>
                      {isCatOver ? (
                        <span className="text-rose-600 font-bold">
                          +₹{(spent - cap).toLocaleString('en-IN')} Over Cap
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">
                          ₹{(cap - spent).toLocaleString('en-IN')} Remaining
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Right Column: Itemized Actual Expenses Ledger Table (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Itemized Expenses Ledger</span>
              </h3>

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-cream-50 border border-cream-300 text-navy-950 focus:outline-none focus:border-coral-500"
                />
              </div>
            </div>

            {filteredLedger.length === 0 ? (
              <Card variant="subtle" className="p-8 text-center space-y-2 border-dashed border-2 border-cream-300">
                <p className="text-xs font-semibold text-navy-700">No actual expenses logged yet.</p>
                <p className="text-[11px] text-navy-500">
                  Click "Log Actual Expense" above to record vendor payments, catering, and operational receipts.
                </p>
              </Card>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-cream-50 shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-cream-200/60 border-b border-cream-300 text-navy-800 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Item & Description</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200">
                    {filteredLedger.map((exp, idx) => (
                      <tr key={idx} className="hover:bg-cream-100/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-navy-950">{exp.title}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-cream-200 text-navy-800 text-[10px] font-bold">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-navy-600 text-[11px]">
                          {exp.recordedAt
                            ? new Date(exp.recordedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Today'}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-navy-950">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: CONFIGURE BUDGET */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Configure Event Budget"
        description={`Set total planned capital and category allocations for "${selectedEvent?.title || 'Selected Event'}".`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveConfig} className="space-y-4 pt-2">
          {configError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {configError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
              Total Event Budget (INR ₹) <span className="text-coral-500">*</span>
            </label>
            <Input
              type="number"
              min={1000}
              value={configTotal}
              onChange={(e) => setConfigTotal(Number(e.target.value))}
              leftIcon={<DollarSign className="w-4 h-4 text-emerald-600" />}
              required
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
                Expense Categories & Allocation Caps
              </label>
              <button
                type="button"
                onClick={() =>
                  setConfigCategories((prev) => [
                    ...prev,
                    { category: 'New Category', allocatedAmount: 5000 },
                  ])
                }
                className="text-xs font-bold text-coral-600 hover:text-coral-700 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {configCategories.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cat.category}
                    onChange={(e) => {
                      const updated = [...configCategories];
                      updated[idx].category = e.target.value;
                      setConfigCategories(updated);
                    }}
                    placeholder="Category Name"
                    className="flex-1 text-xs py-2 px-3 rounded-xl bg-cream-50 border border-cream-300 text-navy-950 focus:outline-none focus:border-coral-500"
                    required
                  />
                  <div className="w-36">
                    <input
                      type="number"
                      min={0}
                      value={cat.allocatedAmount}
                      onChange={(e) => {
                        const updated = [...configCategories];
                        updated[idx].allocatedAmount = Number(e.target.value);
                        setConfigCategories(updated);
                      }}
                      placeholder="₹ Amount"
                      className="w-full text-xs py-2 px-3 rounded-xl bg-cream-50 border border-cream-300 text-navy-950 focus:outline-none focus:border-coral-500"
                      required
                    />
                  </div>
                  {configCategories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setConfigCategories(configCategories.filter((_, i) => i !== idx));
                      }}
                      className="p-2 text-rose-500 hover:text-rose-700"
                      title="Remove category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-cream-300">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfigModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSavingConfig}
              isLoading={isSavingConfig}
            >
              Save Budget Settings
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: LOG ACTUAL EXPENSE */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Log Actual Expense"
        description={`Record a vendor receipt, invoice, or operational cost for "${selectedEvent?.title || 'Selected Event'}".`}
      >
        <form onSubmit={handleLogExpense} className="space-y-4 pt-2">
          {expenseError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {expenseError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
              Expense Item Description <span className="text-coral-500">*</span>
            </label>
            <Input
              placeholder="e.g. Hall B Booking Deposit, High-Res Projector Rental"
              value={expenseTitle}
              onChange={(e) => setExpenseTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
              Amount (INR ₹) <span className="text-coral-500">*</span>
            </label>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 12500"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(Number(e.target.value))}
              leftIcon={<DollarSign className="w-4 h-4 text-emerald-600" />}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-800">
              Expense Category
            </label>
            <select
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
              className="w-full text-xs py-2.5 px-3 rounded-xl bg-cream-50 border border-cream-300 text-navy-950 focus:outline-none focus:border-coral-500"
            >
              {(budget?.expenseCategories || []).map((c, i) => (
                <option key={i} value={c.category}>
                  {c.category}
                </option>
              ))}
              <option value="General Operations">General Operations</option>
              <option value="Marketing & Printing">Marketing & Printing</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-cream-300">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExpenseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isLoggingExpense}
              isLoading={isLoggingExpense}
            >
              Record Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BudgetManagement;
