// This layout wrapper is required for Next.js to resolve all routes
// under the (admin) route group (e.g. /dashboard, /dashboard/products, etc.)
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
