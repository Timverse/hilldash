import { ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

interface StaticPageProps {
  title: string
  subtitle?: string
  lastUpdated?: string
  children: ReactNode
}

export function StaticPage({ title, subtitle, lastUpdated, children }: StaticPageProps) {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="border-b bg-slate-50/50">
        <div className="container mx-auto px-4 py-16 text-center max-w-4xl">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900">{title}</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none mb-6">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
          {lastUpdated && (
            <p className="mt-8 text-xs font-bold uppercase tracking-widest text-slate-400">
              Last Updated: {lastUpdated}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <div className="prose prose-slate prose-lg max-w-none 
          prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900
          prose-p:text-slate-600 prose-p:leading-relaxed
          prose-strong:text-slate-900 prose-strong:font-bold
          prose-li:text-slate-600
          prose-a:text-primary prose-a:font-bold hover:prose-a:underline
        ">
          {children}
        </div>
      </div>
    </div>
  )
}
