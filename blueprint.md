HillDash Master Blueprint & Roadmap
Based on the rules.md file and the current state of the codebase, here is the exact roadmap to take HillDash from its current state to a fully launched, production-ready platform by Week 4.

📍 Where We Are Right Now
We have successfully established the most difficult foundational pieces of the application:

Core Infrastructure: Next.js 15 (Turbopack), Tailwind v4, and ShadCN UI are fully configured.
Secure Authentication: Supabase SSR is running flawlessly. The middleware.ts rigidly protects admin routes and validates the super_admin / warehouse_admin roles.
Inventory Engine: The app/(admin)/dashboard/products route is fully functional. We have image uploads hitting the product-images bucket, Zod validation, and products successfully linking to the Jowai Central Hub.
Dynamic Dashboard: The admin home page correctly fetches real-time stats from the database.
🚀 The 4-Week Execution Plan
✅ Week 1: Foundation & Security (COMPLETED)
 Project Initialization & Folder Structure.
 Tailwind CSS "Meghalaya-inspired" Theme Setup.
 Supabase SSR Client & Middleware Protection.
 Admin Login Page & Authentication Actions.
 Initial SQL Database Schema (profiles, categories).
🟡 Week 2: Inventory, Admin Ops & Geolocation (CURRENT)
 Build Product Inventory UI (DataTables, Forms, Toggles).
 Implement Supabase Storage for Images.
 Step 1: Build the Categories and Warehouses Admin UI.
 Step 2: Define the remaining Database Schema (users, orders, order_items, riders).
 Step 3: Implement the Distance Calculation Utility.
Note on Distance: Since we are avoiding Google APIs, we will use the HTML5 Geolocation API on the customer's device to get their exact Latitude/Longitude, and use the Haversine Formula (pure math) to calculate the straight-line distance to the Jowai Hub to determine delivery fees or serviceability.
🔵 Week 3: Customer Web App & Cart System
 Step 4: Build the Customer Frontend (Homepage, Hero, Product Grid).
 Step 5: Fetch and display only "Active" products linked to the Jowai Hub.
 Step 6: Implement the Shopping Cart using zustand for lightning-fast, client-side state management.
 Step 7: Build the Checkout Flow. This will capture the customer's delivery details, request their HTML5 Geolocation, calculate the distance, and insert the final order into the orders and order_items tables via Server Actions.
🟢 Week 4: Real-time Order Management & Launch
 Step 8: Build the Admin Orders Dashboard (/dashboard/orders).
 Step 9: Wire up Supabase Realtime. When a customer checks out, the Admin dashboard will instantly ding and display the new order without refreshing.
 Step 10: Implement Admin Order Actions (Accept, Reject, Pack, Assign to Rider).
 Step 11: Build the Customer Order Tracking Page (/track/[id]), which listens to real-time status changes pushed by the Admin.
 Step 12: Final Polish, Error Boundary testing, and Vercel Deployment.
How the Distance Calculation Will Work (No Credit Card / No Google API)
When the customer clicks "Checkout":

The browser will prompt: "HillDash wants to know your location."
We capture the Customer's [Lat, Lng].
We fetch the Jowai Hub's [Lat, Lng] from the database.
We run a mathematical Haversine function in TypeScript to get the distance in Kilometers.
If Distance > max_radius, we block the order. If it's within bounds, we calculate the delivery fee dynamically based on the km distance!