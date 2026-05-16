import { StaticPage } from "@/components/shared/static-page"

export default function CookiesPage() {
  return (
    <StaticPage 
      title="Cookie Policy" 
      subtitle="How we use cookies and similar technologies on Sawaïom."
      lastUpdated="May 16, 2026"
    >
      <h2>What are Cookies?</h2>
      <p>
        Cookies are small text files that are stored on your device when you visit a website. They help us remember your preferences and improve your browsing experience.
      </p>

      <h2>How We Use Cookies</h2>
      <p>We use cookies for several reasons:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Essential:</strong> These are necessary for the website to function, such as keeping you logged in or remembering items in your cart.</li>
        <li><strong>Performance:</strong> These help us understand how visitors interact with our site, allowing us to fix bugs and improve the layout.</li>
        <li><strong>Functional:</strong> These remember your choices, such as your delivery location or language preference.</li>
        <li><strong>Marketing:</strong> We may use these to show you relevant offers based on your interests.</li>
      </ul>

      <h2>Managing Cookies</h2>
      <p>
        Most browsers allow you to control cookies through their settings. However, disabling essential cookies may affect your ability to use certain features of the Sawaïom platform, such as placing orders.
      </p>

      <h2>Third-Party Cookies</h2>
      <p>
        We may use third-party services like Google Analytics or Supabase that also set cookies to provide their functionality.
      </p>
    </StaticPage>
  )
}
