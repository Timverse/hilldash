Build a production-ready scalable grocery delivery platform called "HillDash".

Business Context:
HillDash is a local quick-commerce and grocery delivery platform starting in Jowai, Meghalaya, India.

Launch Model:
- Single warehouse: Jowai Central Hub
- Single super admin initially
- Customers order via website
- Admin receives orders in real-time
- Admin manually contacts store partners / warehouse staff
- Admin accepts/rejects orders
- Admin updates status
- Admin assigns rider manually
- Customer tracks status live

Future Scaling:
System must be architected for:
- Multiple warehouses across Meghalaya
- Warehouse-specific inventory
- Warehouse-specific admins
- Orders auto-routed to nearest warehouse by service radius
- Role-based access control
- Expansion into own inventory-based dark stores

Important:
Build scalable multi-warehouse architecture NOW,
but launch UI should behave as single-warehouse Jowai system.

Tech Stack:
- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- ShadCN UI
- Supabase (DB + Auth + Realtime)
- Zustand
- Vercel deployment

Design Theme:
- Premium modern quick-commerce
- Meghalaya-inspired
- Cloud + hill visual identity
- Fast loading
- Mobile-first
- Low-bandwidth optimized

Features:

CUSTOMER WEBSITE

Homepage:
- Hero section
- Search products
- Categories
- Featured essentials
- Delivery zone info
- Why choose HillDash

Products:
- Product grid
- Filters
- Categories
- Search
- Add to cart

Product Detail:
- Images
- Description
- Price
- Quantity selector

Cart:
- Quantity editing
- Remove item
- Delivery fee summary

Checkout:
Fields:
- Name
- Phone
- Address
- Landmark
- Notes
- Payment method (COD / UPI)

Order Success:
- Order ID
- Estimated delivery time

Track Order:
Live realtime status timeline:
- Received
- Confirmed
- Packing
- Picked Up
- Out for Delivery
- Delivered
- Rejected

ADMIN SYSTEM

Roles:
1. Super Admin
- Full access
- Manage all warehouses
- Manage admins
- Global analytics

2. Warehouse Admin
- View only assigned warehouse orders
- Update statuses
- Manage local inventory
- Assign riders

Initial Launch:
Only Super Admin active

Admin Dashboard Modules:

Orders:
- Realtime incoming orders
- Accept / Reject
- Status updates
- Assign rider
- Search/filter
- Notes

Products:
- CRUD
- Images
- Pricing
- Availability

Categories:
- CRUD

Warehouses:
- Add warehouse
- Name
- Address
- Latitude
- Longitude
- Delivery radius
- Active toggle

Admins:
- Add/remove
- Assign warehouse
- Role management

Riders:
- CRUD
- Assign orders
- Status

Analytics:
- Daily orders
- Revenue
- Popular products
- Warehouse metrics

DATABASE SCHEMA

users
- id
- name
- phone
- address

warehouses
- id
- name
- address
- latitude
- longitude
- radius_km
- active

admins
- id
- email
- role
- warehouse_id nullable

products
- id
- warehouse_id
- name
- category_id
- price
- stock
- image
- description
- active

categories
- id
- name

orders
- id
- user_id
- warehouse_id
- total
- status
- payment_method
- notes
- created_at

order_items
- id
- order_id
- product_id
- quantity
- price

riders
- id
- warehouse_id
- name
- phone
- active

admin_notes
- id
- order_id
- admin_id
- note

AUTHORIZATION RULES

Super Admin:
Access everything

Warehouse Admin:
Access only records matching warehouse_id

Realtime:
Customer tracking updates instantly when admin updates order status

INITIAL LOGIC

Create default warehouse:

"HillDash Jowai Central"

All launch orders auto-assigned to this warehouse.

Future:
Replace with nearest-active-warehouse assignment algorithm.

CODE REQUIREMENTS

- Modular architecture
- Reusable components
- Clean comments
- Type-safe APIs
- Optimistic UI
- Skeleton loaders
- Toast notifications
- Error boundaries
- SEO optimized
- Production-ready

DELIVERABLES

Generate:

1. Complete project structure
2. Supabase SQL schema
3. Auth system
4. Realtime subscriptions
5. Admin dashboard
6. Customer website
7. Warehouse role filtering
8. Deployment guide
9. README

Begin by generating complete project folder structure and Supabase schema first.

let's do one by one, week by week.
First give me the blueprints and the steps of what we're building, also note that we will do distance, no need for google api because i don't have a credit card