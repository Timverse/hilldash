import { login, signup, signInWithGoogle } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ShoppingBag, ArrowRight, ShieldCheck, Sparkles, User, Mail, Lock, Phone, Calendar } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans antialiased selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <div className="w-full max-w-lg mx-auto">
        {/* Top Brand Banner */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-4 group">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xl group-hover:scale-105 transition-transform duration-500 bg-white border border-slate-100 flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-emerald-600" />
            </div>
            <div className="flex flex-col text-left justify-center">
              <span className="font-black text-4xl tracking-tighter text-slate-900 leading-none">
                Sawa<span className="text-emerald-600">ïom</span>
              </span>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 mt-1 leading-none">
                Rooted in Meghalaya
              </span>
            </div>
          </Link>
        </div>

        <Card className="w-full shadow-2xl border border-slate-100/80 rounded-[3rem] overflow-hidden bg-white/95 backdrop-blur-2xl transition-all duration-300">
          <CardHeader className="space-y-4 text-center bg-gradient-to-b from-emerald-50/40 via-white to-white pt-10 pb-8 border-b border-slate-100/50 px-8 sm:px-12">
            <CardTitle className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              {currentTab === 'signin' && "Welcome to Sawaïom"}
              {currentTab === 'signup' && "Create Your Account"}
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium text-base max-w-sm mx-auto leading-relaxed">
              {currentTab === 'signin' && "Log in to your customer or admin account to continue shopping."}
              {currentTab === 'signup' && "Sign up to start ordering fresh local essentials instantly."}
            </CardDescription>

            {/* Toggle Tabs - Beautifully Spaced Horizontally */}
            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl max-w-md mx-auto mt-6 shadow-inner gap-2 border border-slate-200/50 w-full">
              <Link 
                href="/login?tab=signin" 
                className={`flex-1 py-3.5 text-sm font-black rounded-xl transition-all duration-300 text-center flex items-center justify-center gap-2 ${
                  currentTab === 'signin' 
                    ? 'bg-white text-emerald-950 shadow-md border border-slate-100 scale-100' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                Sign In
              </Link>
              <Link 
                href="/login?tab=signup" 
                className={`flex-1 py-3.5 text-sm font-black rounded-xl transition-all duration-300 text-center flex items-center justify-center gap-2 ${
                  currentTab === 'signup' 
                    ? 'bg-white text-emerald-950 shadow-md border border-slate-100 scale-100' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                Sign Up
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-3 pt-3 text-xs font-extrabold text-slate-400 tracking-wider uppercase">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> 256-Bit Encrypted</span>
            </div>
          </CardHeader>

          <CardContent className="pt-10 px-8 sm:px-12 space-y-8">
            {/* SOCIAL OAUTH BUTTON: GOOGLE */}
            <div className="space-y-4">
              <form action={signInWithGoogle}>
                <Button variant="outline" className="w-full h-14 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-base shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-3.5 group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.7/h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.9:3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Continue with Google
                </Button>
              </form>

              <div className="relative flex items-center justify-center py-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                <div className="relative bg-white px-6 text-xs font-black uppercase tracking-widest text-slate-400">
                  {currentTab === 'signin' ? 'Or sign in with email' : 'Or sign up with email'}
                </div>
              </div>
            </div>

            {/* TAB 1: SIGN IN FORM */}
            {currentTab === 'signin' && (
              <form id="signin-form" action={login} className="space-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="signin-email" className="text-slate-700 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600" /> Email Address
                  </Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:bg-white font-bold text-base text-slate-900 shadow-inner px-6 transition-all duration-300"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="signin-password" className="text-slate-700 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" /> Password
                  </Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:bg-white font-bold text-base text-slate-900 shadow-inner px-6 transition-all duration-300"
                  />
                </div>

                {message && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 text-center shadow-sm animate-shake">
                    {message}
                  </div>
                )}
              </form>
            )}

            {/* TAB 2: SIGN UP FORM */}
            {currentTab === 'signup' && (
              <form id="signup-form" action={signup} className="space-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="signup-name" className="text-slate-700 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" /> Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    name="full_name"
                    type="text"
                    placeholder="Pynshngainlang Lyngdoh"
                    required
                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:bg-white font-bold text-base text-slate-900 shadow-inner px-6 transition-all duration-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <Label htmlFor="signup-age" className="text-slate-700 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" /> Age
                    </Label>
                    <Input
                      id="signup-age"
                      name="age"
                      type="number"
                      min="1"
                      max="120"
                      placeholder="e.g. 28"
                      required
                      className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:bg-white font-bold text-base text-slate-900 shadow-inner px-6 transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="signup-phone" className="text-slate-700 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600" /> Phone Number
                    </Label>
                    <Input
                      id="signup-phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 8974319494"
                      required
                      className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:bg-white font-bold text-base text-slate-900 shadow-inner px-6 transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="signup-email" className="text-slate-700 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600" /> Email Address
                  </Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:bg-white font-bold text-base text-slate-900 shadow-inner px-6 transition-all duration-300"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="signup-password" className="text-slate-700 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" /> Create Password
                  </Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:bg-white font-bold text-base text-slate-900 shadow-inner px-6 transition-all duration-300"
                  />
                </div>

                {message && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 text-center shadow-sm animate-shake">
                    {message}
                  </div>
                )}
              </form>
            )}
          </CardContent>

          <CardFooter className="px-8 sm:px-12 pb-10 pt-6 bg-slate-50/60 border-t border-slate-100 flex flex-col gap-5">
            <Button 
              form={currentTab === 'signin' ? "signin-form" : "signup-form"} 
              className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-xl shadow-emerald-600/20 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 group"
            >
              {currentTab === 'signin' ? "Sign In" : "Create Account"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>

            <div className="text-center text-sm text-slate-500 font-medium pt-2 w-full flex justify-center items-center gap-4">
              {currentTab === 'signin' ? (
                <p>Don't have an account? <Link href="/login?tab=signup" className="text-emerald-600 font-black hover:underline">Sign Up</Link></p>
              ) : (
                <p>Already have an account? <Link href="/login?tab=signin" className="text-emerald-600 font-black hover:underline">Sign In</Link></p>
              )}
            </div>
            <p className="text-[11px] text-slate-400 text-center max-w-xs mx-auto leading-relaxed font-medium">
              By continuing, you agree to Sawaïom's Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
