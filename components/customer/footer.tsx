import Link from "next/link"
import { X, Camera, Mail, Phone, MapPin, Send } from "lucide-react"

export function CustomerFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">H</span>
              </div>
              <span className="font-extrabold text-2xl tracking-tighter text-white">
                HillDash
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Meghalaya's premier scalable quick-commerce and grocery delivery platform. Bringing fresh essentials to your doorstep in minutes.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-primary transition-colors">
                <Send className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-primary transition-colors">
                <Camera className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-primary transition-colors">
                <X className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Shop & Discover</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/shop" className="hover:text-primary transition-colors">Browse Products</Link></li>
              <li><Link href="/shop?category=fruits" className="hover:text-primary transition-colors">Fresh Fruits</Link></li>
              <li><Link href="/shop?category=vegetables" className="hover:text-primary transition-colors">Organic Vegetables</Link></li>
              <li><Link href="/shop?category=snacks" className="hover:text-primary transition-colors">Quick Snacks</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Quick Links</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/account" className="hover:text-primary transition-colors">My Account</Link></li>
              <li><Link href="/track" className="hover:text-primary transition-colors">Track Order</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About HillDash</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold text-white uppercase text-xs tracking-widest">Contact Info</h4>
            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span>Jowai Central Hub, West Jaintia Hills, Meghalaya</span>
              </div>
              <div className="flex gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>support@hilldash.in</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium uppercase tracking-wider text-slate-500">
          <p>&copy; {new Date().getFullYear()} HillDash Services Pvt. Ltd.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

