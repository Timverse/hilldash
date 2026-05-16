import { StaticPage } from "@/components/shared/static-page"
import Image from "next/image"

export default function AboutPage() {
  return (
    <StaticPage 
      title="About HillDash" 
      subtitle="The story of Meghalaya's fastest grocery delivery service."
      lastUpdated="May 15, 2026"
    >
      <h2>Our Mission</h2>
      <p>
        At HillDash, our mission is simple: to make life easier for the people of Meghalaya by providing lightning-fast access to fresh groceries and daily essentials. We believe that technology should serve the community, bridging the gap between local producers and urban consumers.
      </p>

      <h2>Born in the Hills</h2>
      <p>
        Founded in 2024, HillDash started as a small project in Jowai. We noticed that while Meghalaya was rich in fresh produce, the logistics of getting that produce to homes quickly was lacking. We built HillDash to solve this local problem with a world-class technology platform.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
          <h3 className="text-primary font-bold text-xl mb-4">Freshness Guaranteed</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            We partner directly with local farmers and trusted distributors to ensure that every fruit, vegetable, and dairy product you receive is at its peak freshness.
          </p>
        </div>
        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
          <h3 className="text-primary font-bold text-xl mb-4">Speed is Our DNA</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Our delivery network is optimized for the unique terrain of Meghalaya. We don't just deliver; we "Dash" to ensure your essentials arrive when you need them.
          </p>
        </div>
      </div>

      <h2>Scaling for the Future</h2>
      <p>
        While we started in Jowai, our vision is to serve every corner of Meghalaya and beyond. We are constantly innovating our logistics and supply chain to reach even the most remote hilltops with efficiency and care.
      </p>

      <h2>Our Values</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Community First:</strong> We support local businesses and farmers.</li>
        <li><strong>Transparency:</strong> Honest pricing and clear communication.</li>
        <li><strong>Reliability:</strong> We show up when we say we will.</li>
        <li><strong>Innovation:</strong> Using technology to solve real-world logistical challenges.</li>
      </ul>
    </StaticPage>
  )
}
