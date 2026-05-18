"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, Banknote, Plus, Calendar, Filter, Search, ArrowUpRight, ArrowDownLeft, FileText, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { addManualFinanceEntryAction } from '@/app/actions/finance';

const CATEGORY_MAP: Record<string, { label: string; badge: string }> = {
  order_revenue:   { label: 'Order Revenue',   badge: 'bg-emerald-100 text-emerald-700' },
  rider_salary:    { label: 'Rider Payout',    badge: 'bg-amber-100 text-amber-700' },
  inventory_cost:  { label: 'Inventory Cost',  badge: 'bg-blue-100 text-blue-700' },
  emergency_fee:   { label: 'Emergency Fee',   badge: 'bg-purple-100 text-purple-700' },
  refund:          { label: 'Refund',          badge: 'bg-red-100 text-red-700' },
  other_income:    { label: 'Other Income',    badge: 'bg-emerald-100 text-emerald-700' },
  other_expense:   { label: 'Other Expense',   badge: 'bg-slate-100 text-slate-700' },
};

export function FinanceClient({ 
  initialReports = [], deliveredOrders = [] 
}: { 
  initialReports: any[]; deliveredOrders: any[] 
}) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports || []);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Manual Entry Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if initial props change via server revalidation
  useEffect(() => {
    setReports(initialReports || []);
  }, [initialReports]);

  // SUPABASE REALTIME SUBSCRIPTION FOR FINANCE LEDGER (INSTANT CLIENT STATE SYNC)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-finance-admin-client')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_finance_reports' }, (payload) => {
        console.log('Realtime finance ledger update received:', payload);

        if (payload.eventType === 'INSERT') {
          const newReport = payload.new;
          setReports(prev => [newReport, ...prev]);
          toast.success('📊 Finance Ledger Updated: New transaction recorded.');
        } else if (payload.eventType === 'UPDATE') {
          const updatedReport = payload.new;
          setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
        } else if (payload.eventType === 'DELETE') {
          setReports(prev => prev.filter(r => r.id !== payload.old?.id));
        }

        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const handleManualSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    const res = await addManualFinanceEntryAction(formData);
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
    } else if (res.success) {
      toast.success("➕ Successfully added transaction to Business Finance Ledger!");
      setIsManualModalOpen(false);
    }
  };

  // Calculate Financial Metrics
  let totalIncome = 0;
  let totalExpense = 0;
  let cashOnHand = 0;
  let onlineBalance = 0;

  reports.forEach(r => {
    const amt = parseFloat(r.amount) || 0;
    if (r.transaction_type === 'income') {
      totalIncome += amt;
      if (r.payment_method === 'cash') cashOnHand += amt;
      else onlineBalance += amt;
    } else {
      totalExpense += amt;
      if (r.payment_method === 'cash') cashOnHand -= amt;
      else onlineBalance -= amt;
    }
  });

  const netProfit = totalIncome - totalExpense;

  // Filtered Reports
  const filteredReports = reports.filter(r => {
    if (filterType !== "all" && r.transaction_type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const desc = (r.description || '').toLowerCase();
      const cat = (r.category || '').toLowerCase();
      const ref = (r.reference_id || '').toLowerCase();
      return desc.includes(q) || cat.includes(q) || ref.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-8 font-sans antialiased selection:bg-primary selection:text-white pb-12">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Finance & Accounting</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Track full business revenue, rider salary payouts, inventory costs, and cashflow in real time.</p>
        </div>
        <Button 
          onClick={() => setIsManualModalOpen(true)}
          className="h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold px-6 shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> ADD INCOME / EXPENSE
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Gross Revenue</CardTitle>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shadow-inner">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">₹{totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Expenses</CardTitle>
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 shadow-inner">
              <TrendingDown className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">₹{totalExpense.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Net Profit</CardTitle>
            <div className={`p-2.5 rounded-xl shadow-inner ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ₹{netProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Cash on Hand</CardTitle>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shadow-inner">
              <Banknote className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">₹{cashOnHand.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Online Balance</CardTitle>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shadow-inner">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">₹{onlineBalance.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <Button
            variant="ghost"
            onClick={() => setFilterType("all")}
            className={`rounded-xl px-4 py-2 h-10 text-xs font-bold transition-all ${
              filterType === "all" ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Transactions
          </Button>
          <Button
            variant="ghost"
            onClick={() => setFilterType("income")}
            className={`rounded-xl px-4 py-2 h-10 text-xs font-bold transition-all ${
              filterType === "income" ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            Income Only
          </Button>
          <Button
            variant="ghost"
            onClick={() => setFilterType("expense")}
            className={`rounded-xl px-4 py-2 h-10 text-xs font-bold transition-all ${
              filterType === "expense" ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-red-50 hover:text-red-700'
            }`}
          >
            Expenses Only
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search description, category..." 
            className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary text-xs font-medium shadow-inner"
          />
        </div>
      </div>

      {/* Financial Ledger Table */}
      <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white overflow-hidden rounded-[2rem]">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-8 py-5 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Full Business Finance Ledger</CardTitle>
          <Badge className="bg-slate-200 text-slate-700 border-none font-extrabold uppercase tracking-widest px-2.5 py-1 text-[10px] rounded-md shadow-sm">
            {filteredReports.length} Entries
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {filteredReports.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-inner">
                <FileText className="w-10 h-10" />
              </div>
              <p className="font-black text-xl text-slate-900 mb-2 tracking-tight">No financial entries found</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
                Use the "Add Income / Expense" button above or execute the STAFF-ROLE-MANAGEMENT.md SQL script to initialize the ledger table.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                <TableRow>
                  <TableHead className="pl-8 font-bold text-slate-700">Date & Time</TableHead>
                  <TableHead className="font-bold text-slate-700">Type</TableHead>
                  <TableHead className="font-bold text-slate-700">Category</TableHead>
                  <TableHead className="font-bold text-slate-700">Description</TableHead>
                  <TableHead className="font-bold text-slate-700">Payment Method</TableHead>
                  <TableHead className="text-right pr-8 font-bold text-slate-700">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => {
                  const catInfo = CATEGORY_MAP[report.category] || CATEGORY_MAP.other_expense;
                  const isIncome = report.transaction_type === 'income';

                  return (
                    <TableRow key={report.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="pl-8 py-4 text-xs font-semibold text-slate-600">
                        {format(new Date(report.created_at), "dd MMM yyyy, hh:mm a")}
                        {report.recorded_by && (
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">By: {report.recorded_by}</div>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${
                          isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          {report.transaction_type}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold shadow-sm ${catInfo.badge}`}>
                          {catInfo.label}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 font-bold text-slate-900 text-sm max-w-xs truncate">
                        {report.description || 'No description'}
                        {report.reference_id && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-normal">Ref: {report.reference_id}</div>
                        )}
                      </TableCell>
                      <TableCell className="py-4 font-bold text-xs text-slate-600 uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          {report.payment_method === 'cash' ? <Banknote className="w-4 h-4 text-amber-600" /> : <CreditCard className="w-4 h-4 text-blue-600" />}
                          {report.payment_method}
                        </div>
                      </TableCell>
                      <TableCell className={`py-4 text-right pr-8 font-black text-base ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'}₹{parseFloat(report.amount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ADD MANUAL ENTRY MODAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 max-w-md w-full space-y-6 shadow-2xl relative overflow-hidden animate-scaleUp">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold shadow-inner">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 text-lg tracking-tight">Add Finance Entry</h3>
              </div>
              <Badge className="bg-primary/10 text-primary font-extrabold px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-md border-none shadow-sm">
                Manual Ledger
              </Badge>
            </div>

            <form action={handleManualSubmit} className="space-y-4 text-sm font-medium">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Transaction Type</label>
                <select 
                  name="transaction_type" 
                  required 
                  className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-3 font-bold text-slate-800 shadow-inner focus:ring-primary"
                >
                  <option value="income">Income (+)</option>
                  <option value="expense">Expense (-)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Category</label>
                <select 
                  name="category" 
                  required 
                  className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-3 font-bold text-slate-800 shadow-inner focus:ring-primary"
                >
                  <option value="order_revenue">Order Revenue</option>
                  <option value="rider_salary">Rider Payout / Salary</option>
                  <option value="inventory_cost">Inventory Cost</option>
                  <option value="emergency_fee">Emergency Fee Revenue</option>
                  <option value="refund">Refund</option>
                  <option value="other_income">Other Income</option>
                  <option value="other_expense">Other Expense</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Amount (₹)</label>
                <Input 
                  name="amount"
                  type="number" 
                  step="0.01" 
                  required 
                  placeholder="e.g. 1500.00" 
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary font-mono font-bold text-base shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Payment Method</label>
                <select 
                  name="payment_method" 
                  required 
                  className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-3 font-bold text-slate-800 shadow-inner focus:ring-primary"
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online / UPI</option>
                  <option value="card">Card</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Description / Notes</label>
                <Input 
                  name="description" 
                  placeholder="e.g. Fuel expense for Hub bike" 
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary text-sm shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Reference ID (Optional)</label>
                <Input 
                  name="reference_id" 
                  placeholder="e.g. INV-2026-05" 
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary font-mono text-sm shadow-inner"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setIsManualModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 h-14 rounded-2xl font-bold border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm active:scale-95 transition-all"
                >
                  CANCEL
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all gap-2"
                >
                  {isSubmitting ? "SAVING..." : "SAVE ENTRY"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
