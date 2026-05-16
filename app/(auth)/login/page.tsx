import { login, signInWithOAuthAction, verifyOtpLogin, completePhoneOnboarding } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ShoppingBag, Phone, ArrowRight, ShieldCheck, Sparkles, User, KeyRound } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; tab?: string; phone?: string }>;
}) {
  const { message, tab, phone } = await searchParams;
  const currentTab = tab || 'otp';
  const currentPhone = phone || '';

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
              {currentTab === 'otp' && "Get Started with HillDash"}
              {currentTab === 'verify_otp' && "Enter Verification Code"}
              {currentTab === 'onboarding' && "Complete Your Profile"}
              {currentTab === 'signin' && "Admin / Staff Console"}
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium text-sm max-w-xs mx-auto">
              {currentTab === 'otp' && "Log in or sign up instantly with your phone number or social accounts."}
              {currentTab === 'verify_otp' && `We sent a 4-digit secure OTP to ${currentPhone}`}
              {currentTab === 'onboarding' && `Welcome! Please enter your name for orders linked to ${currentPhone}`}
              {currentTab === 'signin' && "Authorized personnel login using official email credentials."}
            </CardDescription>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit Encrypted</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Khasi Farmers Direct</span>
            </div>
          </CardHeader>

          <CardContent className="pt-8 px-8 space-y-6">
            {/* SOCIAL OAUTH BUTTONS (Only visible on initial OTP / Login tab) */}
            {currentTab === 'otp' && (
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

                <form action={() => signInWithOAuthAction('apple')}>
                  <Button variant="outline" className="w-full h-13 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 group border-none">
                    <svg className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 5.26c.61-.75 1.02-1.8 1.02-2.88 0-.05-.01-.1-.01-.15-.97.04-2.11.65-2.75 1.43-.57.69-.98 1.74-.98 2.83 0 .06.01.12.02.16.03 0 .07.01.12.01.88 0 1.97-.65 2.58-1.4"/>
                    </svg>
                    Continue with Apple
                  </Button>
                </form>

                <div className="relative flex items-center justify-center py-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                  <div className="relative bg-white px-4 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Or continue with phone</div>
                </div>
              </div>
            )}

            {/* TAB 1: PHONE NUMBER INPUT */}
            {currentTab === 'otp' && (
              <form action={`/login`} method="GET" className="space-y-4">
                <input type="hidden" name="tab" value="verify_otp" />
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> Mobile Number
                  </Label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 font-black text-slate-700 text-base pointer-events-none">+91</span>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="98765 43210"
                      required
                      className="h-13 pl-14 pr-4 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-bold text-base text-slate-900 shadow-inner tracking-wide"
                    />
                  </div>
                </div>
                <Button className="w-full h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 group">
                  Send OTP Code
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            )}

            {/* TAB 2: VERIFY OTP SCREEN (Equipped with WebOTP auto-read autocomplete="one-time-code") */}
            {currentTab === 'verify_otp' && (
              <form action={verifyOtpLogin} className="space-y-4">
                <input type="hidden" name="phone" value={currentPhone} />
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="otp" className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" /> 4-Digit Secure OTP
                    </Label>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 animate-pulse">Tip: Use 1234</span>
                  </div>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={4}
                    placeholder="1234"
                    required
                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-mono text-center text-2xl tracking-[1em] text-slate-900 font-black shadow-inner"
                  />
                </div>

                {message && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 text-center shadow-sm animate-shake">
                    {message}
                  </div>
                )}

                <Button className="w-full h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 group">
                  Verify & Continue
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>

                <div className="text-center pt-2">
                  <Link href="/login?tab=otp" className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors">
                    ← Change Phone Number
                  </Link>
                </div>
              </form>
            )}

            {/* TAB 3: NAME CAPTURE ONBOARDING SCREEN */}
            {currentTab === 'onboarding' && (
              <form action={completePhoneOnboarding} className="space-y-4">
                <input type="hidden" name="phone" value={currentPhone} />
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" /> Your Full Name
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="Pynshngainlang Lyngdoh"
                    required
                    className="h-13 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-bold text-base text-slate-900 shadow-inner"
                  />
                </div>

                {message && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 text-center shadow-sm animate-shake">
                    {message}
                  </div>
                )}

                <Button className="w-full h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 group">
                  Complete Setup
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            )}

            {/* TAB 4: LEGACY ADMIN / STAFF SIGNIN */}
            {currentTab === 'signin' && (
              <form action={login} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Staff Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@hilldash.com"
                    required
                    className="h-13 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 focus-visible:bg-white font-bold text-base text-slate-900 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Staff Password</Label>
                  <Input
                    id="password"
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

                <Button className="w-full h-13 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-xl shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                  Access Admin Console
                </Button>

                <div className="text-center pt-2">
                  <Link href="/login?tab=otp" className="text-xs font-bold text-emerald-600 hover:underline">
                    ← Back to Customer Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>

          <CardFooter className="px-8 pb-8 pt-4 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-3">
            <div className="text-center text-xs text-slate-500 font-medium w-full flex justify-center items-center gap-4">
              {currentTab !== 'otp' && currentTab !== 'verify_otp' && currentTab !== 'onboarding' && (
                <Link href="/login?tab=otp" className="text-emerald-600 font-bold hover:underline flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Continue with Phone
                </Link>
              )}
              {currentTab !== 'signin' && (
                <Link href="/login?tab=signin" className="text-slate-500 hover:text-slate-900 font-medium transition-colors">
                  Authorized Staff Login
                </Link>
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
