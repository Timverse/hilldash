import { login, signup, signInWithOAuthAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ShoppingBag, ArrowRight, ShieldCheck, Sparkles, User, Mail, Lock, Phone } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string; tab?: string }> | { message?: string; tab?: string };
}) {
  const resolvedParams = await Promise.resolve(searchParams || {});
  const message = (resolvedParams as any).message;
  const tab = (resolvedParams as any).tab;
  const currentTab = tab || 'signin';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-md">
        {/* Top Brand Banner */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl group-hover:scale-105 transition-transform duration-300 bg-white border border-slate-100 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-black text-3xl tracking-tighter text-slate-900 leading-none">
                Hill<span className="text-emerald-600">Dash</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-0.5 leading-none">
                BigBasket Grade Logistics
              </span>
            </div>
          </Link>
        </div>

        <Card className="w-full shadow-2xl border border-slate-100/80 rounded-[2.5rem] overflow-hidden bg-white/90 backdrop-blur-xl">
          <CardHeader className="space-y-3 text-center bg-gradient-to-b from-emerald-50/50 via-white to-white pt-8 pb-6 border-b border-slate-100/50 px-8">
            <CardTitle className="text-3xl font-black tracking-tight text-slate-900">
              {currentTab === 'signin' && "Welcome to HillDash"}
              {currentTab === 'signup' && "Create Your Account"}
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium text-sm max-w-xs mx-auto">
              {currentTab === 'signin' && "Log in to your customer or admin account to continue shopping."}
              {currentTab === 'signup' && "Sign up to start ordering fresh local Khasi groceries instantly."}
            </CardDescription>

            {/* Toggle Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl max-w-sm mx-auto mt-4 shadow-inner gap-1">
              <Link 
                href="/login?tab=signin" 
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all text-center ${currentTab === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Sign In
              </Link>
              <Link 
                href="/login?tab=signup" 
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all text-center ${currentTab === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Sign Up
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit Encrypted</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Khasi Farmers Direct</span>
            </div>
          </CardHeader>

          <CardContent className="pt-8 px-8 space-y-6">
            {/* SOCIAL OAUTH BUTTON: GOOGLE */}
            <div className="space-y-3">
              <form action={() => signInWithOAuthAction('google')}>
                <Button variant="outline" className="w-full h-13 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50/80 text-slate-700 font-bold text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Continue with Google
                </Button>
              </form>

              <div className="relative flex items-center justify-center py-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                <div className="relative bg-white px-4 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                  {currentTab === 'signin' ? 'Or sign in with email' : 'Or sign up with email'}
                </div>
              </div>
            </div>

            {/* TAB 1: SIGN IN FORM */}
            {currentTab === 'signin' && (
              <form id="signin-form" action={login} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" /> Email Address
                  </Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    className="h-13 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-bold text-base text-slate-900 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" /> Password
                  </Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="h-13 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-bold text-base text-slate-900 shadow-inner"
                  />
                </div>

                {message && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 text-center shadow-sm animate-shake">
                    {message}
                  </div>
                )}
              </form>
            )}

            {/* TAB 2: SIGN UP FORM */}
            {currentTab === 'signup' && (
              <form id="signup-form" action={signup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" /> Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    name="full_name"
                    type="text"
                    placeholder="Pynshngainlang Lyngdoh"
                    required
                    className="h-13 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-bold text-base text-slate-900 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone" className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> Phone Number
                  </Label>
                  <Input
                    id="signup-phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    required
                    className="h-13 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-bold text-base text-slate-900 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" /> Email Address
                  </Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    className="h-13 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-bold text-base text-slate-900 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" /> Create Password
                  </Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="h-13 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-bold text-base text-slate-900 shadow-inner"
                  />
                </div>

                {message && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 text-center shadow-sm animate-shake">
                    {message}
                  </div>
                )}
              </form>
            )}
          </CardContent>

          <CardFooter className="px-8 pb-8 pt-4 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-4">
            <Button 
              form={currentTab === 'signin' ? "signin-form" : "signup-form"} 
              className="w-full h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 group"
            >
              {currentTab === 'signin' ? "Sign In" : "Create Account"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="text-center text-xs text-slate-500 font-medium pt-2 w-full flex justify-center items-center gap-4">
              {currentTab === 'signin' ? (
                <p>Don't have an account? <Link href="/login?tab=signup" className="text-emerald-600 font-bold hover:underline">Sign Up</Link></p>
              ) : (
                <p>Already have an account? <Link href="/login?tab=signin" className="text-emerald-600 font-bold hover:underline">Sign In</Link></p>
              )}
            </div>
            <p className="text-[10px] text-slate-400 text-center max-w-xs mx-auto leading-relaxed">
              By continuing, you agree to HillDash's Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
