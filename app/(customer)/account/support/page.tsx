import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, Clock, MessageSquare, PhoneCall, HelpCircle, Send } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="bg-slate-50/50 min-h-screen py-12 font-sans antialiased">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-12">
          <Link href="/account" className="inline-flex items-center gap-2 text-primary font-bold hover:underline group mb-6">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Account
          </Link>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
            24/7 <span className="text-primary italic">Support</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium mt-3">We are here to help with your orders and delivery inquiries in Jowai.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
              <PhoneCall className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">Direct Call</h3>
            <p className="text-slate-500 text-xs font-medium mb-6">Speak instantly with our Jowai dispatch team.</p>
            <a href="tel:+919876543210" className="w-full">
              <Button variant="outline" className="w-full rounded-xl font-bold border-2 h-11 text-purple-700 border-purple-200 hover:bg-purple-50">Call Support</Button>
            </a>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">Live Chat</h3>
            <p className="text-slate-500 text-xs font-medium mb-6">Chat with our support bot or available agents.</p>
            <Button className="w-full rounded-xl font-bold h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">Start Chat</Button>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
              <HelpCircle className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">FAQs</h3>
            <p className="text-slate-500 text-xs font-medium mb-6">Browse quick answers to common questions.</p>
            <Link href="/faq" className="w-full">
              <Button variant="outline" className="w-full rounded-xl font-bold border-2 h-11 text-amber-700 border-amber-200 hover:bg-amber-50">View FAQs</Button>
            </Link>
          </div>
        </div>

        {/* Submit Ticket Form */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-12 shadow-sm space-y-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Send a Support Message</h2>
            <p className="text-slate-500 text-sm font-medium">Describe your issue or order inquiry, and our team will get back to you within 15 minutes.</p>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Order ID (Optional)</label>
                <Input placeholder="e.g. ORD-123456" className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary px-6 text-lg font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Subject</label>
                <Input required placeholder="e.g. Delivery Status Inquiry" className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary px-6 text-lg font-medium" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Message</label>
              <Textarea required rows={5} placeholder="Please provide details about your inquiry..." className="rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary p-6 text-lg font-medium" />
            </div>

            <Button type="button" className="w-full h-16 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all active:scale-[0.98] gap-2">
              <Send className="w-5 h-5" /> Submit Support Ticket
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
