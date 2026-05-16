-- ====================================================================
-- SAWAÏOM AMAZON-GRADE PROMOTIONS & DISCOUNTS MIGRATION
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    title TEXT NOT NULL,
    code TEXT,
    discount_type TEXT NOT NULL, -- 'percentage' or 'fixed_amount'
    discount_value NUMERIC NOT NULL,
    target_type TEXT NOT NULL, -- 'all', 'category', 'product'
    target_id UUID, -- links to categories.id or products.id
    min_order_value NUMERIC DEFAULT 0,
    max_discount_amount NUMERIC,
    start_date TIMESTAMPTZ DEFAULT now(),
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow public read access to active discounts for cart calculations
CREATE POLICY "Allow public read access on active discounts"
    ON public.discounts FOR SELECT
    USING (is_active = true);

-- Policy 2: Allow owner full administrative access to manage discounts
CREATE POLICY "Allow owner full access on discounts"
    ON public.discounts FOR ALL
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'owner'));

-- Insert Sample Amazon-Grade Promotions
INSERT INTO public.discounts (title, code, discount_type, discount_value, target_type, min_order_value, max_discount_amount, is_active)
VALUES 
('Festive Season Megashow', 'FESTIVE10', 'percentage', 10, 'all', 500, 1000, true),
('Super Saver Grocery Deal', 'SAVER50', 'fixed_amount', 50, 'all', 1000, 50, true)
ON CONFLICT DO NOTHING;
