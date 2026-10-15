-- ==============================================================================
-- LittleHug BD - Supabase PostgreSQL Database Schema & Initial Data
-- E-commerce store for baby gifts, kids toys & travel luggage
-- 100% Validated for Supabase SQL Editor execution
-- ==============================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'returned'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE coupon_type AS ENUM ('percent', 'fixed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES

-- Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  sub_label TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  old_price NUMERIC(10, 2) CHECK (old_price >= price),
  discount_percent INT DEFAULT 0,
  badge TEXT,
  secondary_badge TEXT,
  sold_count INT DEFAULT 0,
  rating NUMERIC(2, 1) DEFAULT 5.0,
  review_count INT DEFAULT 0,
  stock INT DEFAULT 100,
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  is_flash_sale BOOLEAN DEFAULT FALSE,
  is_hot_deal BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Images Table
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

-- Product Variants Table (sizes, colors, etc.)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  price_override NUMERIC(10, 2),
  stock INT DEFAULT 50
);

-- Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  image_url TEXT NOT NULL,
  link TEXT DEFAULT '/',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery Zones Table
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  charge NUMERIC(10, 2) NOT NULL,
  estimated_days TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0
);

-- Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type coupon_type NOT NULL DEFAULT 'percent',
  value NUMERIC(10, 2) NOT NULL,
  min_order NUMERIC(10, 2) DEFAULT 0,
  usage_limit INT DEFAULT 1000,
  used_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders Sequence & Table
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1001;

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL DEFAULT ('LH-' || nextval('order_number_seq')::TEXT),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  delivery_zone TEXT NOT NULL,
  delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 60,
  subtotal NUMERIC(10, 2) NOT NULL,
  discount NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  coupon_code TEXT,
  payment_method TEXT DEFAULT 'COD',
  status order_status DEFAULT 'pending',
  note TEXT,
  courier_tracking_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant TEXT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL
);

-- Wishlist Table
CREATE TABLE IF NOT EXISTS public.wishlist (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FUNCTIONS & TRIGGERS

-- Trigger to handle new auth user creation -> create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.admins WHERE admins.email = NEW.email) THEN 'admin'::user_role
      ELSE 'customer'::user_role
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Prevent profile trigger error from blocking user sign-up
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Helper to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.email = auth.jwt()->>'email'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
$$;

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Uses DROP POLICY IF EXISTS before CREATE POLICY to ensure 100% idempotent execution

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Admins (Public readable so client role checker can verify admin emails without circular RLS)
DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;
CREATE POLICY "Admins can view admins" ON public.admins FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins admin write" ON public.admins;
CREATE POLICY "Admins admin write" ON public.admins FOR ALL USING (public.is_admin());

-- Profiles
DROP POLICY IF EXISTS "Profiles readable by owner and admins" ON public.profiles;
CREATE POLICY "Profiles readable by owner and admins" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR email = auth.jwt()->>'email' OR public.is_admin());

DROP POLICY IF EXISTS "Profiles updatable by owner" ON public.profiles;
CREATE POLICY "Profiles updatable by owner" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Categories
DROP POLICY IF EXISTS "Categories are public readable" ON public.categories;
CREATE POLICY "Categories are public readable" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Categories admin write" ON public.categories;
CREATE POLICY "Categories admin write" ON public.categories FOR ALL USING (public.is_admin());

-- Products
DROP POLICY IF EXISTS "Products public read" ON public.products;
CREATE POLICY "Products public read" ON public.products FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Products admin write" ON public.products;
CREATE POLICY "Products admin write" ON public.products FOR ALL USING (public.is_admin());

-- Product Images & Variants
DROP POLICY IF EXISTS "Product images public read" ON public.product_images;
CREATE POLICY "Product images public read" ON public.product_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Product images admin write" ON public.product_images;
CREATE POLICY "Product images admin write" ON public.product_images FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Product variants public read" ON public.product_variants;
CREATE POLICY "Product variants public read" ON public.product_variants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Product variants admin write" ON public.product_variants;
CREATE POLICY "Product variants admin write" ON public.product_variants FOR ALL USING (public.is_admin());

-- Banners & Delivery Zones
DROP POLICY IF EXISTS "Banners public read" ON public.banners;
CREATE POLICY "Banners public read" ON public.banners FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Banners admin write" ON public.banners;
CREATE POLICY "Banners admin write" ON public.banners FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Zones public read" ON public.delivery_zones;
CREATE POLICY "Zones public read" ON public.delivery_zones FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Zones admin write" ON public.delivery_zones;
CREATE POLICY "Zones admin write" ON public.delivery_zones FOR ALL USING (public.is_admin());

-- Coupons
DROP POLICY IF EXISTS "Coupons public read active" ON public.coupons;
CREATE POLICY "Coupons public read active" ON public.coupons FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Coupons admin write" ON public.coupons;
CREATE POLICY "Coupons admin write" ON public.coupons FOR ALL USING (public.is_admin());

-- Orders
DROP POLICY IF EXISTS "Orders insertable by anyone" ON public.orders;
CREATE POLICY "Orders insertable by anyone" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Orders viewable by owner or admin" ON public.orders;
CREATE POLICY "Orders viewable by owner or admin" ON public.orders FOR SELECT USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR public.is_admin()
);

DROP POLICY IF EXISTS "Orders admin update" ON public.orders;
CREATE POLICY "Orders admin update" ON public.orders FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Orders admin delete" ON public.orders;
CREATE POLICY "Orders admin delete" ON public.orders FOR DELETE USING (public.is_admin());

-- Order Items
DROP POLICY IF EXISTS "Order items insertable" ON public.order_items;
CREATE POLICY "Order items insertable" ON public.order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Order items viewable" ON public.order_items;
CREATE POLICY "Order items viewable" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND ((orders.user_id = auth.uid()) OR public.is_admin())
  )
);

DROP POLICY IF EXISTS "Order items admin delete" ON public.order_items;
CREATE POLICY "Order items admin delete" ON public.order_items FOR DELETE USING (public.is_admin());

-- Wishlist
DROP POLICY IF EXISTS "Wishlist viewable by owner" ON public.wishlist;
CREATE POLICY "Wishlist viewable by owner" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Wishlist insertable by owner" ON public.wishlist;
CREATE POLICY "Wishlist insertable by owner" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Wishlist deletable by owner" ON public.wishlist;
CREATE POLICY "Wishlist deletable by owner" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);

-- Reviews
DROP POLICY IF EXISTS "Reviews public read" ON public.reviews;
CREATE POLICY "Reviews public read" ON public.reviews FOR SELECT USING (is_approved = true OR public.is_admin());

DROP POLICY IF EXISTS "Reviews insertable by authenticated or guest" ON public.reviews;
CREATE POLICY "Reviews insertable by authenticated or guest" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Reviews admin write" ON public.reviews;
CREATE POLICY "Reviews admin write" ON public.reviews FOR ALL USING (public.is_admin());

-- Site Settings
DROP POLICY IF EXISTS "Settings public read" ON public.site_settings;
CREATE POLICY "Settings public read" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Settings admin write" ON public.site_settings;
CREATE POLICY "Settings admin write" ON public.site_settings FOR ALL USING (public.is_admin());

-- 5. INITIAL SEED DATA

-- Admin Email (You can also change role in profiles table)
INSERT INTO public.admins (email) 
VALUES ('rifatkhan4054ff@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Delivery Zones
INSERT INTO public.delivery_zones (name, name_bn, charge, estimated_days, sort_order) VALUES
('Inside Dhaka', 'ঢাকার ভিতরে', 60, '১–৩ কার্যদিবস', 1),
('Around Dhaka (Narayanganj, Gazipur, Savar, Keraniganj)', 'ঢাকার আশেপাশে (নারায়ণগঞ্জ, গাজীপুর, সাভার, কেরানীগঞ্জ)', 100, '১–৩ কার্যদিবস', 2),
('Outside Dhaka', 'ঢাকার বাইরে', 130, '৩–৫ কার্যদিবস', 3)
ON CONFLICT DO NOTHING;

-- Site Settings
INSERT INTO public.site_settings (key, value) VALUES
('whatsapp_number', '"01717823525"'),
('call_number', '"01717823525"'),
('free_delivery_threshold', '999'),
('extra_discount_threshold', '1999'),
('extra_discount_percent', '5'),
('site_name', '"LittleHug BD"'),
('tagline_en', '"LITTLE THINGS, BIG HAPPINESS"'),
('tagline_bn', '"ছোট্ট আদর, বড় হাসি"'),
('flash_sale_end_time', '"2026-12-31T23:59:59Z"')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Coupons
INSERT INTO public.coupons (code, type, value, min_order, usage_limit, is_active) VALUES
('LITTLEHUG', 'fixed', 100, 1000, 500, true),
('WELCOME50', 'fixed', 50, 500, 1000, true),
('HUG10', 'percent', 10, 1500, 200, true)
ON CONFLICT (code) DO NOTHING;

-- Categories (Using 100% valid hexadecimal UUIDs: a0000000-0000-0000-0000-00000000000X)
INSERT INTO public.categories (id, name, name_bn, slug, sub_label, sort_order) VALUES
('a0000000-0000-0000-0000-000000000001', 'Baby Gift Box', 'বেবি গিফট বক্স', 'baby-gift-box', 'Newborn', 1),
('a0000000-0000-0000-0000-000000000002', 'Blue Box', 'ব্লু বক্স', 'blue-box', 'Kids Gift', 2),
('a0000000-0000-0000-0000-000000000003', 'Yellow Box', 'ইউলো বক্স', 'yellow-box', 'Birthday', 3),
('a0000000-0000-0000-0000-000000000004', 'Purple Box', 'পার্পল বক্স', 'purple-box', 'Premium', 4),
('a0000000-0000-0000-0000-000000000005', 'Rescue Toy', 'রেসকিউ টয়', 'rescue-toy', 'Toy Collection', 5),
('a0000000-0000-0000-0000-000000000006', 'Travel Luggage', 'ট্রাভেল লাগেজ', 'travel-luggage', 'Travel', 6),
('a0000000-0000-0000-0000-000000000007', 'Combo Offer', 'কম্বো অফার', 'combo-offer', 'Combo', 7)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_bn = EXCLUDED.name_bn,
  sub_label = EXCLUDED.sub_label,
  sort_order = EXCLUDED.sort_order;

-- Products (Using 100% valid hexadecimal UUIDs: b0000000-0000-0000-0000-0000000000XX)
INSERT INTO public.products (
  id, category_id, name, name_bn, slug, description, short_description, price, old_price, discount_percent, badge, secondary_badge, sold_count, rating, review_count, stock, is_featured, is_flash_sale, is_hot_deal, is_active
) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Pink Teddy Gift Box - Newborn Special', 'পিংক টেডি গিফট বক্স', 'pink-teddy-gift-box-newborn-special', 'নবজাতক কন্যা শিশুদের জন্য প্রিমিয়াম কোয়ালিটির গিফট হ্যাম্পার।', 'সফট টেডি, কটন বিব, বুটিজ ও কাঠের র্যাটল সহ প্রিমিয়াম বেবি গিফট বক্স', 1850, 3700, 50, '50% ছাড়', 'GIFT', 45, 5.0, 12, 45, true, true, false, true),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Mint Bear Gift Box - Little King', 'মিন্ট বিয়ার গিফট বক্স', 'mint-bear-gift-box-little-king', 'ছোট্ট রাজপুত্রের জন্য মিষ্টি মিন্ট গ্রিন রঙের বিলাসবহুল উপহার সেট।', 'মিন্ট প্লাশ টেডি, রম্পার ও ম্যাচিং এক্সেসরিজ সেট', 1950, 3900, 50, '50% ছাড়', 'BEST', 35, 5.0, 8, 35, true, true, false, true),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Sunshine Yellow Gift Box', 'ইউলো সানশাইন বক্স', 'sunshine-yellow-gift-box', 'উজ্জ্বল সানশাইন হলুদ থিমের আনন্দময় নিউবর্ন হ্যাম্পার।', 'সানশাইন প্লাশ ডাকলিং ও প্রিমিয়াম সোয়্যাডেল সেট', 1750, 3500, 50, '50% ছাড়', 'NEW', 28, 5.0, 5, 28, true, true, false, true),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'Dreamy Purple Gift Box', 'পার্পল ড্রিম বক্স', 'dreamy-purple-gift-box', 'ল্যাভেন্ডার পার্পল থিমের মনমুগ্ধকর বেবি গিফট বক্স।', 'ল্যাভেন্ডার টেডি ও কমপ্লিট নিউবর্ন কেয়ার সেট', 1890, 3780, 50, '50% ছাড়', 'HOT', 30, 5.0, 9, 30, true, true, false, true),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'Ocean Blue Gift Box - Bunny', 'ব্লু বানি বক্স', 'ocean-blue-gift-box-bunny', 'শান্ত স্নিগ্ধ আকাশী নীল রঙের চমৎকার কিউট বানি হ্যাম্পার।', 'নীল রঙের সফট বানি প্লাশ ও বেবি এসেনশিয়ালস', 1790, 3580, 50, '50% ছাড়', 'BEST', 40, 5.0, 14, 40, true, true, false, true),
('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000005', 'City Hero Fire Rescue 8 PCS Set', 'ফায়ার রেসকিউ খেলনা সেট', 'city-hero-fire-rescue-8-pcs-set', 'বাচ্চাদের প্রিয় সিটি হিরো ৮ পিসের ফায়ার রেসকিউ ভেহিকেল সেট।', '৮ পিস মেটাল ও প্লাস্টিক ফায়ার রেসকিউ গাড়ি সেট', 1650, 3300, 50, '50% ছাড়', 'TOY', 50, 5.0, 24, 50, true, true, true, true),
('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000006', 'Unicorn Travel Luggage 18"', 'ইউনিকর্ন ট্রাভেল লাগেজ ১৮"', 'unicorn-travel-luggage-18-inch', 'বাচ্চাদের জন্য স্পেশাল ১৮ ইঞ্চি ইউনিকর্ন ট্রাভেল লাগেজ।', '১৮ ইঞ্চি কিউট ইউনিকর্ন থিম ট্রলি লাগেজ স্পিনার চাকা সহ', 4250, 8500, 50, '50% ছাড়', 'HOT', 25, 5.0, 18, 25, true, false, true, true),
('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000006', 'Astronaut Luggage - Space', 'মহাকাশচারী ট্রাভেল লাগেজ', 'astronaut-luggage-space', 'স্পেস এক্সপ্লোরেশন থিমের অসাধারণ কিডস ট্রাভেল ট্রলি লাগেজ।', 'স্পেস অ্যাস্ট্রোনট থিম ১৮ ইঞ্চি বাচ্চাদের লাগেজ', 4350, 8700, 50, '50% ছাড়', 'NEW', 20, 5.0, 11, 20, true, false, true, true),
('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000006', 'Bunny Travel Luggage - Pink', 'পিংক বানি ট্রাভেল লাগেজ', 'bunny-travel-luggage-pink', 'সফট পিংক কালারে মিষ্টি থ্রি-ডি বানি কান ও হাসি মুখের বাচ্চাদের ট্রাভেল লাগেজ।', 'পিংক বানি কিউট ইয়ার্স সহ ১৮ ইঞ্চি ট্রলি ব্যাগ', 4150, 8300, 50, '50% ছাড়', 'BEST', 22, 5.0, 16, 22, true, false, true, true),
('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000006', 'Little King Bear Luggage', 'লিটল কিং বিয়ার লাগেজ', 'little-king-bear-luggage', 'কিউট টেডি বিয়ার প্রিন্ট সহ বাচ্চাদের শক্ত ও টেকসই ভ্রমণের লাগেজ।', 'লিটল কিং বিয়ার গ্রাফিক্স সহ ১৮ ইঞ্চি লাগেজ', 4250, 8500, 50, '50% ছাড়', 'GIFT', 18, 5.0, 7, 18, true, false, true, true),
('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000006', 'Dinosaur Roar Luggage - Green', 'সবুজ ডাইনোসর লাগেজ', 'dinosaur-roar-luggage-green', 'কিউট গ্রিন ডাইনোসর রোয়ার থিমের চিয়ারফুল লাগেজ।', 'গ্রিন ডাইনোসর ১৮ ইঞ্চি কিডস ট্রলি ব্যাগ', 4450, 8900, 50, '50% ছাড়', 'TOY', 15, 5.0, 10, 15, true, false, true, true),
('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000006', 'Sweet Girl Cat Luggage', 'সুইট গার্ল ক্যাট লাগেজ', 'sweet-girl-cat-luggage', 'মিষ্টি কিটি বিড়াল থিমের ট্রাভেল ট্রলি লাগেজ।', 'সুইট ক্যাট থিম ১৮ ইঞ্চি বাচ্চাদের লাগেজ', 4050, 8100, 50, '50% ছাড়', 'NEW', 16, 5.0, 8, 16, true, false, true, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_bn = EXCLUDED.name_bn,
  price = EXCLUDED.price,
  old_price = EXCLUDED.old_price,
  description = EXCLUDED.description,
  short_description = EXCLUDED.short_description;

-- 6. STORAGE BUCKETS (Optional / safe block)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('product-images', 'product-images', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('banners', 'banners', true)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN others THEN
    NULL; -- Silently continue if storage schema permissions vary
END $$;

-- ==============================================================================
-- 7. HOW TO MAKE ANY ACCOUNT AN ADMIN (RUN IN SUPABASE SQL EDITOR):
-- ==============================================================================
-- Insert the admin email into the admins table:
INSERT INTO public.admins (email) 
VALUES ('rifatkhan4054ff@gmail.com') 
ON CONFLICT (email) DO NOTHING;

-- Also update their profile role to 'admin' (if signed up already):
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'rifatkhan4054ff@gmail.com';
-- ==============================================================================

