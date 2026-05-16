import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { ShoppingBag, TrendingUp, Users, PackageCheck, ArrowRight, ClipboardList, Clock } from "lucide-react";
import { createAdminClient } from '@/lib/supabase/admin';
import { format } from "date-fns";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_FLOW: Record<string, { label: string; badge: string }> = {
  pending:          { label: "Pending Review",   badge: "bg-blue-100 text-blue-700" },
  confirmed:        { label: "Confirmed",        badge: "bg-indigo-100 text-indigo-700" },
  packed:           { label: "Packed",           badge: "bg-amber-100 text-amber-700" },
  out_for_delivery: { label: "Out for Delivery", badge: "bg-purple-100 text-purple-700" },
  delivered:        { label: "Delivered",        badge: "bg-emerald-100 text-emerald-700" },
  cancelled:        { label: "Cancelled",        badge: "bg-red-100 text-red-700" },
};

export default async function DashboardPage() {
    const adminClient = createAdminClient();

    // Fetch dynamic product count bypassing RLS and without hardcoded warehouse ID
    const { count: productCount } = await adminClient
        .from('products')
        .select('*', { count: 'exact', head: true });

    // Fetch all orders for comprehensive metrics bypassing RLS
    const { data: orders } = await adminClient
        .from('orders')
        .select('id, created_at, total, status, customer_name, customer_phone, notes, payment_method')
        .order('created_at', { ascending: false });

    const safeOrders = orders || [];

    // Calculate metrics dynamically
    const totalRevenue = safeOrders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const activeOrderCount = safeOrders
        .filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;

    // Unique customers based on phone or name
    const uniqueCustomers = new Set(
        safeOrders.map(o => o.customer_phone || o.notes?.match(/Phone: ([^\n]+)/)?.[1]).filter(Boolean)
    ).size;

    const stats = [
        { title: "Total Revenue", value: `₹${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: "text-blue-600" },
        { title: "Active Orders", value: activeOrderCount.toString(), icon: ShoppingBag, color: "text-emerald-600" },
        { title: "Products", value: (productCount || 0).toString(), icon: PackageCheck, color: "text-orange-600" },
        { title: "Customers", value: uniqueCustomers.toString(), icon: Users, color: "text-purple-600" },
    ];

    const recentOrders = safeOrders.slice(0, 5);

    return (
        <div className="space-y-8 font-sans antialiased">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Khublei, Admin!</h1>
                    <p className="text-slate-500 font-medium mt-1">Here is what is happening at the Jowai Central Hub today.</p>
                </div>
                <Link href="/dashboard/orders">
                    <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-2 shadow-lg shadow-emerald-700/20 h-12 rounded-xl px-6">
                        <ClipboardList className="w-5 h-5" /> Manage Live Orders
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.title} className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white hover:shadow-md transition-shadow rounded-3xl p-2">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 px-6 pt-6">
                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.title}</CardTitle>
                            <div className={`p-3 rounded-2xl bg-slate-50 ${stat.color} shadow-inner`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            <div className="text-4xl font-black text-slate-900 mt-2">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Orders Section */}
            <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white overflow-hidden rounded-3xl">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-5 bg-slate-50/50 px-8 pt-6">
                    <div className="flex items-center gap-3">
                        <Clock className="w-6 h-6 text-emerald-700" />
                        <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Recent Orders</CardTitle>
                    </div>
                    <Link href="/dashboard/orders" className="text-sm font-bold text-emerald-700 hover:underline flex items-center gap-1.5 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
                        View All Orders <ArrowRight className="w-4 h-4" />
                    </Link>
                </CardHeader>
                <CardContent className="p-0">
                    {recentOrders.length === 0 ? (
                        <div className="p-16 text-center flex flex-col items-center justify-center">
                            <div className="bg-slate-100 p-6 rounded-3xl mb-4 text-slate-400 shadow-inner">
                                <ShoppingBag size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">No orders yet</h3>
                            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">When customers start ordering from HillDash, they will appear here in real-time.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                                <TableRow>
                                    <TableHead className="pl-8 font-bold text-slate-700">Order ID</TableHead>
                                    <TableHead className="font-bold text-slate-700">Customer</TableHead>
                                    <TableHead className="font-bold text-slate-700">Payment</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700">Total</TableHead>
                                    <TableHead className="text-center pr-8 font-bold text-slate-700">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentOrders.map((order) => {
                                    const flow = STATUS_FLOW[order.status] || { label: order.status, badge: "bg-slate-100 text-slate-700" };
                                    const nameMatch = order.notes?.match(/Name: ([^\n]+)/);
                                    const phoneMatch = order.notes?.match(/Phone: ([^\n]+)/);
                                    const customerName = order.customer_name || nameMatch?.[1] || "Guest";
                                    const customerPhone = order.customer_phone || phoneMatch?.[1] || "-";

                                    return (
                                        <TableRow key={order.id} className="hover:bg-slate-50/80 transition-colors">
                                            <TableCell className="font-mono text-xs font-bold text-slate-600 pl-8 py-4">
                                                #{order.id.slice(0, 8).toUpperCase()}
                                                <div className="text-[10px] font-semibold text-slate-400 mt-1">
                                                    {format(new Date(order.created_at), "dd MMM, hh:mm a")}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <p className="font-bold text-sm text-slate-900">{customerName}</p>
                                                <p className="text-xs font-semibold text-slate-500 mt-0.5">{customerPhone}</p>
                                            </TableCell>
                                            <TableCell className="text-sm font-bold text-slate-600 capitalize py-4">
                                                {order.payment_method?.replace(/_/g, " ") || "COD"}
                                            </TableCell>
                                            <TableCell className="text-right font-black text-slate-900 text-base py-4">
                                                ₹{order.total?.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-center pr-8 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${flow.badge}`}>
                                                    {flow.label}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
