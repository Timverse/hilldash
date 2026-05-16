import { StaticPage } from "@/components/shared/static-page"

export default function FAQPage() {
  const faqs = [
    {
      q: "What are your delivery hours?",
      a: "We deliver from 7:00 AM to 10:00 PM every day, including weekends and public holidays."
    },
    {
      q: "How fast is the delivery?",
      a: "In Jowai Central, we aim to deliver within 30-45 minutes. For outskirts, it may take up to 60-90 minutes depending on the terrain and weather."
    },
    {
      q: "Is there a minimum order value?",
      a: "Yes, the minimum order value for free delivery is ₹500. For orders below this value, a nominal delivery fee of ₹40 applies."
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
      q: "Do you deliver in Shillong?",
      a: "Currently, we are exclusively operating in Jowai. However, we have plans to expand to Shillong and Tura by late 2026."
    }
  ]

  return (
    <StaticPage 
      title="Frequently Asked Questions" 
      subtitle="Find quick answers to common questions about HillDash."
      lastUpdated="May 15, 2026"
    >
      <div className="space-y-8 my-12">
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

      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 mt-16">
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
