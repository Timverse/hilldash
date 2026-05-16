import { StaticPage } from "@/components/shared/static-page"

export default function PrivacyPage() {
  return (
    <StaticPage 
      title="Privacy Policy" 
      subtitle="How we collect, use, and protect your personal information."
      lastUpdated="May 15, 2026"
    >
      <h2>1. Information We Collect</h2>
      <p>
        We collect information you provide directly to us, such as your name, email address, phone number, and delivery address when you create an account or place an order.
      </p>

      <h2>2. How We Use Your Information</h2>
      <p>
        We use your information to process and deliver orders, communicate with you about your account, and improve our services. We may also send you promotional offers with your consent.
      </p>

      <h2>3. Data Sharing</h2>
      <p>
        We do not sell your personal information. We may share data with third-party service providers (e.g., delivery partners, payment processors) only as necessary to provide our services.
      </p>

      <h2>4. Data Security</h2>
      <p>
        We implement industry-standard security measures to protect your data from unauthorized access or disclosure.
      </p>

      <h2>5. Your Choices</h2>
      <p>
        You can access and update your profile information in the account settings. You can also opt-out of marketing communications at any time.
      </p>

      <h2>6. Cookies</h2>
      <p>
        We use cookies to enhance your browsing experience and analyze site traffic. You can manage cookie preferences through your browser settings.
      </p>

      <h2>7. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us at support@hilldash.in.
      </p>
    </StaticPage>
  )
}
