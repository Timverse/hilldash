"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

const categories = [
  {
    title: "Fresh Fruits",
    description: "Sourced from local orchards",
    image: "/images/fruits.png",
    link: "/shop?category=fruits",
    className: "md:col-span-2 md:row-span-2 min-h-[400px]",
    color: "bg-orange-500/10"
  },
  {
    title: "Organic Vegetables",
    description: "Farm to table in minutes",
    image: "/images/vegetables.png",
    link: "/shop?category=vegetables",
    className: "md:col-span-2 md:row-span-1 min-h-[220px]",
    color: "bg-emerald-500/10"
  },
  {
    title: "Dairy & Eggs",
    description: "Fresh daily essentials",
    image: "/images/dairy.png",
    link: "/shop?category=dairy",
    className: "md:col-span-1 md:row-span-1 min-h-[220px]",
    color: "bg-blue-500/10"
  },
  {
    title: "Snacks",
    description: "Your favorite munchies",
    image: "/images/snacks.png",
    link: "/shop?category=snacks",
    className: "md:col-span-1 md:row-span-1 min-h-[220px]",
    color: "bg-purple-500/10"
  }
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export function HomeBento() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-none">
              Shop by <span className="text-primary italic">Category</span>
            </h2>
            <p className="text-slate-500 text-lg">
              Explore our wide range of fresh produce and daily essentials, carefully curated for your needs.
            </p>
          </div>
          <Link href="/shop" className="group flex items-center gap-2 font-bold text-primary hover:underline">
            View All Categories
            <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {categories.map((cat, idx) => (
            <motion.div 
              key={idx}
              variants={item}
              className={`group bento-card relative overflow-hidden rounded-[2.5rem] ${cat.className}`}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url('${cat.image}')` }}
              />
              <div className={`absolute inset-0 transition-opacity duration-500 opacity-60 group-hover:opacity-80 ${cat.color}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                <h3 className="text-3xl font-black mb-2 leading-none group-hover:-translate-y-1 transition-transform duration-300">{cat.title}</h3>
                <p className="text-slate-200 text-sm font-medium opacity-90 group-hover:opacity-100 transition-opacity duration-300">{cat.description}</p>
                <Link href={cat.link} className="absolute top-8 right-8 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-100 group-hover:bg-primary border border-white/30 shadow-lg hover:scale-105 transition-all duration-300">
                  <ArrowUpRight className="w-6 h-6 text-white" />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
