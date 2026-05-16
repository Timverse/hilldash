import { StaticPage } from "@/components/shared/static-page"

export default function TermsPage() {
  return (
    <StaticPage 
      title="Terms of Service" 
      subtitle="The rules and guidelines for using the Sawaïom platform."
      lastUpdated="May 16, 2026"
    >
      <h2>1. Introduction</h2>
      <p>
        Welcome to Sawaïom. These Terms of Service govern your use of our website and mobile application. By accessing or using our services, you agree to be bound by these terms.
      </p>

      <h2>2. Use of Services</h2>
      <p>
        Sawaïom provides a platform for ordering groceries and daily essentials for delivery. You must be at least 18 years old to use our services. You are responsible for maintaining the confidentiality of your account information.
      </p>

      <h2>3. Ordering and Delivery</h2>
      <p>
        Orders are subject to availability. We strive to deliver within the estimated timeframes, but delays may occur due to traffic, weather, or other factors. Delivery is currently limited to Jowai in Meghalaya.
      </p>

      <h2>4. Pricing and Payments</h2>
      <p>
        All prices are inclusive of taxes unless stated otherwise. Delivery fees may apply based on distance and order value. We accept various payment methods, including Cash on Delivery (COD) and digital payments.
      </p>

      <h2>5. Cancellations and Refunds</h2>
      <p>
        Orders can be cancelled before they are packed. Refunds for pre-paid orders will be processed within 5-7 business days. Quality concerns should be reported within 24 hours of delivery.
      </p>

      <h2>6. Limitation of Liability</h2>
      <p>
        Sawaïom is not liable for any indirect, incidental, or consequential damages arising from your use of our services.
      </p>

      <h2>7. Changes to Terms</h2>
      <p>
        We may update these terms from time to time. Your continued use of the services after such changes constitutes acceptance of the new terms.
      </p>
    </StaticPage>
  )
}
