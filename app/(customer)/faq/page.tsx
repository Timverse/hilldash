import { StaticPage } from "@/components/shared/static-page"

export default function FAQPage() {
  const faqs = [
    {
      q: "What are your delivery hours?",
      a: "We operate from 8:00 AM to 8:00 PM every day. Orders placed after 8:00 PM will be available for delivery the next day."
    },
    {
      q: "How do delivery time slots work?",
      a: "During checkout, you can select a convenient delivery time slot (e.g., 8:00 AM - 10:00 AM, 10:00 AM - 12:00 PM, etc.) for your order to arrive."
    },
    {
      q: "Is there a minimum order value?",
      a: "Yes, the minimum order value for free delivery is ₹500. For orders below this value, a nominal delivery fee applies."
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept Cash on Delivery (COD), UPI (GPay, PhonePe, Paytm), and all major Credit/Debit cards."
    },
    {
      q: "Can I return fresh produce?",
      a: "Yes, if you receive items that are damaged or not fresh, you can return them at the time of delivery. For other quality concerns, please contact support within 24 hours."
    },
    {
      q: "Where do you deliver?",
      a: "Currently, we are delivering across Jowai, Meghalaya."
    }
  ]

  return (
    <StaticPage 
      title="Frequently Asked Questions" 
      subtitle="Find quick answers to common questions about Sawaïom."
      lastUpdated="May 16, 2026"
    >
      <div className="space-y-8 my-12 font-sans antialiased">
        {faqs.map((faq, i) => (
          <div key={i} className="border-b border-slate-100 pb-8 last:border-0">
            <h3 className="font-bold text-slate-900 text-lg mb-3 flex gap-4">
              <span className="text-primary font-black">Q.</span>
              {faq.q}
            </h3>
            <div className="flex gap-4">
              <span className="text-slate-300 font-black">A.</span>
              <p className="text-slate-600 leading-relaxed">
                {faq.a}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 mt-16 font-sans antialiased">
        <h3 className="font-bold text-slate-900 mb-2">Still have questions?</h3>
        <p className="text-sm text-slate-600 mb-6">
          If you couldn't find the answer you were looking for, please get in touch with our support team.
        </p>
        <a 
          href="/contact" 
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary/90 transition-colors"
        >
          Contact Support
        </a>
      </div>
    </StaticPage>
  )
}
