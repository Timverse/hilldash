-- Setup Initial Categories for HillDash
-- Run this in your Supabase SQL Editor

-- Insert common grocery categories
INSERT INTO categories (name) VALUES
  ('Vegetables'),
  ('Fruits'),
  ('Dairy & Eggs'),
  ('Meat & Seafood'),
  ('Rice & Grains'),
  ('Spices & Condiments'),
  ('Snacks & Beverages'),
  ('Bakery'),
  ('Personal Care'),
  ('Household Items')
ON CONFLICT (name) DO NOTHING;

-- Verify the warehouse exists (should already be there)
SELECT id, name, is_active FROM warehouses;

-- Verify categories were created
SELECT id, name FROM categories ORDER BY name;
