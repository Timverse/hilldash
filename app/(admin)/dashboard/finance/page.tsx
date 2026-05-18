import { createClient } from '@/lib/supabase/server';
import { FinanceClient } from './finance-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminFinancePage() {
  const supabase = await createClient();

  // Fetch all transactions from business_finance_reports
  const { data: reports, error } = await supabase
    .from('business_finance_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch finance reports (table may not exist yet):', error);
  }

  // Fetch recent orders to show order revenue summary if needed
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total, status, payment_method, created_at')
    .eq('status', 'delivered')
    .order('created_at', { ascending: false });

  return (
    <FinanceClient 
      initialReports={reports || []} 
      deliveredOrders={orders || []} 
    />
  );
}
