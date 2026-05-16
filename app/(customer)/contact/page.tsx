import { StaticPage } from "@/components/shared/static-page"
import { Mail, Phone, MapPin, MessageSquare, Clock } from "lucide-react"

export default function ContactPage() {
  return (
    <StaticPage 
      title="Contact Support" 
      subtitle="We're here to help you with any questions or concerns."
      lastUpdated="May 15, 2026"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="flex flex-col items-center text-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Phone className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Call Us</h3>
          <p className="text-sm text-slate-600">+91 98765 43210</p>
          <p className="text-xs text-slate-400 mt-1">Mon-Sat, 9am-8pm</p>
        </div>

        <div className="flex flex-col items-center text-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Email Us</h3>
          <p className="text-sm text-slate-600">support@hilldash.in</p>
          <p className="text-xs text-slate-400 mt-1">Response within 24 hours</p>
        </div>

        <div className="flex flex-col items-center text-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Live Chat</h3>
          <p className="text-sm text-slate-600">Available in App</p>
          <p className="text-xs text-slate-400 mt-1">Instant assistance</p>
        </div>
      </div>

      <h2>Our Hubs</h2>
      <div className="space-y-6">
        <div className="flex gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <MapPin className="w-6 h-6 text-primary shrink-0" />
          <div>
            <h4 className="font-bold text-slate-900">Jowai Central Hub (Main)</h4>
            <p className="text-sm text-slate-600">
              Ladmthad, Near Civil Hospital, Jowai,<br />
              West Jaintia Hills, Meghalaya - 793150
            </p>
          </div>
        </div>
        
        <div className="flex gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <Clock className="w-6 h-6 text-primary shrink-0" />
          <div>
            <h4 className="font-bold text-slate-900">Operating Hours</h4>
            <p className="text-sm text-slate-600">
              Delivery: 7:00 AM - 10:00 PM (Daily)<br />
              Support: 9:00 AM - 8:00 PM (Mon - Sat)
            </p>
          </div>
        </div>
      </div>

      <h2 className="mt-12">Frequent Queries</h2>
      <p>
        Before reaching out, you might find your answer in our <a href="/faq" className="text-primary hover:underline">FAQ section</a>. Common topics include delivery tracking, payment issues, and return requests.
      </p>

      <div className="mt-12 p-8 bg-primary rounded-3xl text-white">
        <h3 className="font-bold text-2xl mb-4 text-white">Are you a vendor?</h3>
        <p className="text-primary-foreground/90 mb-6 max-w-lg">
          Join Meghalaya's fastest-growing delivery network and sell your products to thousands of local customers.
        </p>
        <button className="bg-white text-primary px-8 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors">
          Partner with Us
        </button>
      </div>
    </StaticPage>
  )
}
