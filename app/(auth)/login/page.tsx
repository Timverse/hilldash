import { login, signup, verifyOtpLogin } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ShoppingBag, Phone } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; tab?: string }>;
}) {
  const { message, tab } = await searchParams;
  const currentTab = tab || 'signin';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans antialiased">
      <Card className="w-full max-w-md shadow-2xl border-none rounded-3xl overflow-hidden bg-white">
        <CardHeader className="space-y-3 text-center bg-gradient-to-b from-emerald-50/50 to-white pt-8 pb-6 border-b border-slate-100">
          <Link href="/" className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 hover:scale-105 transition-transform">
            <ShoppingBag className="w-7 h-7" />
          </Link>
          <CardTitle className="text-3xl font-black tracking-tight text-slate-900">
            {currentTab === 'signup' && "Create Account"}
            {currentTab === 'signin' && "Welcome to HillDash"}
            {currentTab === 'otp' && "Instant OTP Login"}
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium text-sm">
            {currentTab === 'signup' && "Sign up to start ordering fresh local Khasi groceries"}
            {currentTab === 'signin' && "Sign in to your customer or admin account"}
            {currentTab === 'otp' && "Enter your phone number to receive a 4-digit verification code"}
          </CardDescription>

          {/* Toggle Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl max-w-sm mx-auto mt-4 shadow-inner gap-1">
            <Link 
              href="/login?tab=signin" 
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center ${currentTab === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Sign In
            </Link>
            <Link 
              href="/login?tab=signup" 
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center ${currentTab === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Sign Up
            </Link>
            <Link 
              href="/login?tab=otp" 
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1 ${currentTab === 'otp' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Phone className="w-3 h-3" /> OTP
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pt-6 px-8">
          {currentTab === 'signin' && (
            /* SIGN IN FORM */
            <form id="signin-form" action={login} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-medium text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Password</Label>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-medium text-slate-900"
                />
              </div>
              {message && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 text-center">
                  {message}
                </div>
              )}
            </form>
          )}

          {currentTab === 'signup' && (
            /* SIGN UP FORM */
            <form id="signup-form" action={signup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="Pynshngainlang Lyngdoh"
                  required
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-medium text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  required
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-medium text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-medium text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Create Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-medium text-slate-900"
                />
              </div>
              {message && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 text-center">
                  {message}
                </div>
              )}
            </form>
          )}

          {currentTab === 'otp' && (
            /* OTP LOGIN FORM */
            <form id="otp-form" action={verifyOtpLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  required
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-medium text-slate-900"
                />
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="otp" className="text-slate-700 font-bold text-xs uppercase tracking-wider">4-Digit OTP Code</Label>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Tip: Use 1234</span>
                </div>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  maxLength={4}
                  placeholder="1234"
                  required
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-mono text-center text-xl tracking-widest text-slate-900 font-black"
                />
              </div>
              {message && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 text-center">
                  {message}
                </div>
              )}
            </form>
          )}
        </CardContent>

        <CardFooter className="px-8 pb-8 pt-2 flex flex-col gap-4">
          <Button 
            form={currentTab === 'signin' ? "signin-form" : currentTab === 'signup' ? "signup-form" : "otp-form"} 
            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-xl shadow-emerald-600/20 transition-all active:scale-95"
          >
            {currentTab === 'signin' && "Sign In"}
            {currentTab === 'signup' && "Create Account"}
            {currentTab === 'otp' && "Verify & Login"}
          </Button>
          
          <div className="text-center text-xs text-slate-500 font-medium pt-4 border-t border-slate-100 w-full flex justify-center gap-4">
            {currentTab !== 'signin' && (
              <Link href="/login?tab=signin" className="text-emerald-600 font-bold hover:underline">Sign In with Email</Link>
            )}
            {currentTab !== 'signup' && (
              <Link href="/login?tab=signup" className="text-emerald-600 font-bold hover:underline">Create Account</Link>
            )}
            {currentTab !== 'otp' && (
              <Link href="/login?tab=otp" className="text-emerald-600 font-bold hover:underline flex items-center gap-1"><Phone className="w-3 h-3" /> Login with OTP</Link>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
