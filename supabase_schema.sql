-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  role text DEFAULT 'customer'::text CHECK (role = ANY (ARRAY['owner'::text, 'staff'::text, 'customer'::text, 'admin'::text, 'sub_admin'::text])),
  full_name text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  phone text,
  avatar_url text,
  is_admin boolean DEFAULT false,
  fcm_token text,
  terms_agreed_at timestamp with time zone,
  terms_version text,
  settings_updated_at timestamp with time zone,
  admin_permission_preset text CHECK (admin_permission_preset IS NULL OR (admin_permission_preset = ANY (ARRAY['support'::text, 'operations'::text, 'marketing'::text, 'custom'::text]))),
  admin_permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.restaurants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  address text,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  latitude double precision,
  longitude double precision,
  cuisine ARRAY,
  description text,
  fssai_number text,
  is_verified boolean DEFAULT false,
  verified_at timestamp with time zone,
  verified_by uuid,
  bank_account_number text,
  bank_ifsc text,
  bank_holder_name text,
  bank_name text,
  suspended_until timestamp with time zone,
  bad_review_count integer DEFAULT 0,
  image_url text,
  id_proof_url text,
  id_proof_type text CHECK (id_proof_type = ANY (ARRAY['aadhaar'::text, 'pan'::text])),
  upi_id text,
  menu_image_url text,
  seller_type text DEFAULT 'restaurant'::text CHECK (seller_type = ANY (ARRAY['restaurant'::text, 'grocery'::text, 'bakery'::text, 'sweet_shop'::text])),
  avg_rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  razorpay_account_id text,
  CONSTRAINT restaurants_pkey PRIMARY KEY (id),
  CONSTRAINT restaurants_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id),
  CONSTRAINT restaurants_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id)
);
CREATE TABLE public.restaurant_staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'waiter'::text CHECK (role = ANY (ARRAY['manager'::text, 'waiter'::text, 'chef'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT restaurant_staff_pkey PRIMARY KEY (id),
  CONSTRAINT restaurant_staff_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT restaurant_staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.restaurant_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  email text NOT NULL,
  invited_by uuid NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT restaurant_invites_pkey PRIMARY KEY (id),
  CONSTRAINT restaurant_invites_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT restaurant_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.menu_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  original_price numeric,
  quantity integer DEFAULT 0 CHECK (quantity >= 0),
  available_from time without time zone,
  available_until time without time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  category text DEFAULT 'Main Course'::text,
  image_url text,
  is_veg boolean DEFAULT false,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  prepared_at timestamp with time zone,
  is_grocery boolean DEFAULT false,
  is_surprise_bag boolean DEFAULT false,
  consume_by text,
  is_available boolean DEFAULT true,
  preparation_time integer DEFAULT 30,
  expiry_image_url text,
  surprise_tags ARRAY DEFAULT '{}'::text[],
  batch_number text,
  expire_date_parsed date,
  is_fresh_confirmed boolean NOT NULL DEFAULT false,
  surprise_category text CHECK (surprise_category IS NULL OR (surprise_category = ANY (ARRAY['bakery'::text, 'grocery'::text, 'meals'::text, 'sweets'::text, 'other'::text]))),
  surprise_category_custom text,
  is_packet boolean DEFAULT false,
  packet_quantity text,
  CONSTRAINT menu_items_pkey PRIMARY KEY (id),
  CONSTRAINT menu_items_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id)
);
CREATE TABLE public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  restaurant_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT favorites_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id)
);
CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  menu_item_id uuid,
  quantity integer DEFAULT 1,
  reserved_until timestamp with time zone NOT NULL DEFAULT (now() + '00:15:00'::interval),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  is_saved_for_later boolean NOT NULL DEFAULT false,
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT cart_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  restaurant_id uuid,
  total_amount numeric NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text])),
  pickup_code text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  payment_id text,
  payment_breakdown jsonb,
  completed_at timestamp with time zone,
  auto_deleted_at timestamp with time zone,
  auto_deleted_reason text,
  archived_until timestamp with time zone,
  pickup_start_at time without time zone,
  pickup_end_at time without time zone,
  pickup_reminder_sent_at timestamp with time zone,
  pickup_start_notified_at timestamp with time zone,
  pickup_end_notified_at timestamp with time zone,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT orders_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  menu_item_id uuid,
  quantity integer NOT NULL,
  price_at_purchase numeric NOT NULL,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['order'::text, 'promo'::text, 'system'::text, 'listing'::text])),
  is_read boolean DEFAULT false,
  link text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.marketing_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  target_audience text DEFAULT 'all'::text,
  sent_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT marketing_campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT marketing_campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.menu_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid,
  image_url text NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'rejected'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  rejected_at timestamp with time zone,
  CONSTRAINT menu_requests_pkey PRIMARY KEY (id),
  CONSTRAINT menu_requests_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid UNIQUE,
  user_id uuid NOT NULL,
  restaurant_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  defect_image_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT reviews_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id)
);
CREATE TABLE public.ads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text,
  description text,
  image_url text NOT NULL,
  redirect_link text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT ads_pkey PRIMARY KEY (id),
  CONSTRAINT ads_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.restaurant_restrictions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  restriction_type text NOT NULL CHECK (restriction_type = ANY (ARRAY['no_menu_add'::text, 'suspended'::text, 'limited'::text])),
  reason text,
  restricted_by uuid,
  restricted_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  restricted_until timestamp with time zone,
  is_active boolean DEFAULT true,
  CONSTRAINT restaurant_restrictions_pkey PRIMARY KEY (id),
  CONSTRAINT restaurant_restrictions_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT restaurant_restrictions_restricted_by_fkey FOREIGN KEY (restricted_by) REFERENCES auth.users(id)
);
CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT tags_pkey PRIMARY KEY (id)
);
CREATE TABLE public.item_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT item_tags_pkey PRIMARY KEY (id),
  CONSTRAINT item_tags_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.menu_items(id),
  CONSTRAINT item_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id)
);
CREATE TABLE public.surprise_bag_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bag_id uuid NOT NULL,
  item_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  CONSTRAINT surprise_bag_items_pkey PRIMARY KEY (id),
  CONSTRAINT surprise_bag_items_bag_id_fkey FOREIGN KEY (bag_id) REFERENCES public.menu_items(id),
  CONSTRAINT surprise_bag_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.menu_items(id)
);
CREATE TABLE public.menu_item_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  menu_item_id uuid,
  restaurant_id uuid NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['created'::text, 'updated'::text, 'quantity_updated'::text, 'deleted'::text])),
  source text NOT NULL CHECK (source = ANY (ARRAY['seller'::text, 'admin'::text, 'system'::text])),
  changed_by uuid,
  snapshot_before jsonb,
  snapshot_after jsonb,
  change_note text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT menu_item_history_pkey PRIMARY KEY (id),
  CONSTRAINT menu_item_history_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id),
  CONSTRAINT menu_item_history_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id),
  CONSTRAINT menu_item_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.admin_role_change_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  changed_by uuid NOT NULL,
  old_role text,
  new_role text,
  old_permission_preset text,
  new_permission_preset text,
  old_permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT admin_role_change_audit_pkey PRIMARY KEY (id),
  CONSTRAINT admin_role_change_audit_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.profiles(id),
  CONSTRAINT admin_role_change_audit_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount numeric NOT NULL,
  discount_type text NOT NULL CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])),
  min_order numeric DEFAULT 0,
  max_discount numeric,
  expires_at timestamp with time zone NOT NULL,
  is_used boolean DEFAULT false,
  user_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT coupons_pkey PRIMARY KEY (id),
  CONSTRAINT coupons_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.item_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT item_favorites_pkey PRIMARY KEY (id),
  CONSTRAINT item_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);