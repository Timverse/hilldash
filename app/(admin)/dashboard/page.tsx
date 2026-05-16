import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { ShoppingBag, TrendingUp, Users, PackageCheck, ArrowRight, ClipboardList, Clock } from "lucide-react";
import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();
    const warehouseId = '63c35bf7-408d-43d5-832f-5b618a89343e';

    // Fetch dynamic product count
    const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('warehouse_id', warehouseId);

    // Fetch all orders for comprehensive metrics
    const { data: orders } = await supabase
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
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Khublei, Admin!</h1>
                    <p className="text-slate-500">Here is what is happening at the Jowai Central Hub today.</p>
                </div>
                <Link href="/dashboard/orders">
                    <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-2 shadow-md">
                        <ClipboardList className="w-4 h-4" /> Manage Live Orders
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.title} className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold text-slate-500">{stat.title}</CardTitle>
                            <div className={`p-2.5 rounded-xl bg-slate-50 ${stat.color}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Orders Section */}
            <Card className="border-none shadow-sm outline outline-1 outline-slate-200 bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4 bg-slate-50/50 px-6">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-700" />
                        <CardTitle className="text-lg font-bold text-slate-900">Recent Orders</CardTitle>
                    </div>
                    <Link href="/dashboard/orders" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
                        View All Orders <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </CardHeader>
                <CardContent className="p-0">
                    {recentOrders.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center">
                            <div className="bg-slate-100 p-4 rounded-full mb-4 text-slate-400">
                                <ShoppingBag size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-1">No orders yet</h3>
                            <p className="text-slate-500 text-sm max-w-sm">When customers start ordering from HillDash, they will appear here in real-time.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="pl-6">Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-center pr-6">Status</TableHead>
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
                                        <TableRow key={order.id} className="hover:bg-slate-50 transition-colors">
                                            <TableCell className="font-mono text-xs text-slate-500 pl-6">
                                                #{order.id.slice(0, 8).toUpperCase()}
                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                    {format(new Date(order.created_at), "dd MMM, hh:mm a")}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-bold text-sm text-slate-900">{customerName}</p>
                                                <p className="text-xs text-slate-500">{customerPhone}</p>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600 capitalize">
                                                {order.payment_method?.replace(/_/g, " ") || "COD"}
                                            </TableCell>
                                            <TableCell className="text-right font-black text-slate-900 text-sm">
                                                ₹{order.total?.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-center pr-6">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${flow.badge}`}>
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
