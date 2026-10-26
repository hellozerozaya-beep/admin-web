import { supabase } from "@/lib/supabase";

export type AdminUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  is_admin: boolean;
  avatar_url?: string | null;
  created_at: string;
  admin_permission_preset?: string | null;
  admin_permissions?: Record<string, boolean>;
};

export type RestaurantRow = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  cuisine: string[] | null;
  seller_type: string | null;
  is_verified: boolean;
  verified_at: string | null;
  id_proof_url: string | null;
  id_proof_type: string | null;
  bank_holder_name: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  upi_id: string | null;
  created_at: string;
  owner?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
};

export type OrderRow = {
  id: string;
  user_id: string | null;
  restaurant_id: string | null;
  total_amount: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  pickup_code: string | null;
  payment_id: string | null;
  payment_breakdown: any;
  created_at: string;
  restaurants?: {
    id: string;
    name: string;
  } | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
  order_items?: Array<{
    id: string;
    quantity: number;
    price_at_purchase: number;
    menu_items?: {
      name: string;
    } | null;
  }>;
};

export type SurpriseBagRow = {
  id: string;
  restaurant_id: string | null;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  quantity: number;
  is_available: boolean;
  image_url: string | null;
  prepared_at: string | null;
  created_at: string;
  restaurants?: {
    id: string;
    name: string;
    address: string | null;
  } | null;
};

export type MenuRequestRow = {
  id: string;
  restaurant_id: string | null;
  image_url: string;
  status: "pending" | "completed" | "rejected";
  created_at: string;
  restaurants?: {
    id: string;
    name: string;
  } | null;
};

export type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  discount: number;
  discount_type: "percentage" | "fixed";
  min_order: number;
  max_discount: number | null;
  is_active: boolean;
  expires_at: string;
  created_at: string;
};

// API calls

export async function fetchPlatformStats() {
  const { data, error } = await supabase.rpc("get_platform_stats");
  if (!error && data) {
    return data;
  }

  // Fallback direct count aggregation if RPC not present
  const [restCount, ordCount, userCount, bagsCount] = await Promise.all([
    supabase.from("restaurants").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("is_surprise_bag", true),
  ]);

  return {
    restaurantCount: restCount.count || 0,
    totalOrders: ordCount.count || 0,
    userCount: userCount.count || 0,
    activeOrders: ordCount.count || 0,
    totalRevenue: 0,
    bagsCount: bagsCount.count || 0,
  };
}

export async function fetchRestaurants() {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*, owner:profiles!restaurants_owner_id_fkey(id, full_name, email)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as RestaurantRow[];
}

export async function verifyRestaurant(id: string, isVerified: boolean) {
  const { error } = await supabase
    .from("restaurants")
    .update({
      is_verified: isVerified,
      verified_at: isVerified ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) throw error;
  return true;
}

export async function fetchOrders(statusFilter?: string) {
  let query = supabase
    .from("orders")
    .select("*, restaurants(id, name), profiles:user_id(full_name, email), order_items(*, menu_items(name))")
    .order("created_at", { ascending: false })
    .limit(500);

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as OrderRow[];
}

export async function updateOrderStatus(orderId: string, status: "pending" | "confirmed" | "completed" | "cancelled") {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) throw error;
  return true;
}

export async function fetchSurpriseBags() {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*, restaurants(id, name, address)")
    .eq("is_surprise_bag", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as SurpriseBagRow[];
}

export async function toggleSurpriseBagStock(itemId: string, isAvailable: boolean) {
  const { error } = await supabase
    .from("menu_items")
    .update({ is_available: isAvailable })
    .eq("id", itemId);

  if (error) throw error;
  return true;
}

export async function fetchMenuRequests() {
  const { data, error } = await supabase
    .from("menu_requests")
    .select("*, restaurants(id, name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as MenuRequestRow[];
}

export async function updateMenuRequestStatus(id: string, status: "completed" | "rejected") {
  const { error } = await supabase
    .from("menu_requests")
    .update({
      status,
      rejected_at: status === "rejected" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) throw error;
  return true;
}

export async function fetchProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_admin, avatar_url, created_at, admin_permission_preset, admin_permissions")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as AdminUser[];
}

export async function updateUserRole(userId: string, newRole: string) {
  // Check if RPC exists
  const { error: rpcError } = await supabase.rpc("admin_change_user_role", {
    p_target_user_id: userId,
    p_new_role: newRole,
  });

  if (!rpcError) return true;

  // Fallback direct update
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole, is_admin: newRole === "admin" || newRole === "sub_admin" })
    .eq("id", userId);

  if (error) throw error;
  return true;
}

export async function fetchCoupons() {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as CouponRow[];
}

export async function toggleCouponActive(couponId: string, isActive: boolean) {
  const { error } = await supabase
    .from("coupons")
    .update({ is_active: isActive })
    .eq("id", couponId);

  if (error) throw error;
  return true;
}

export async function createMenuItem(item: {
  restaurant_id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  quantity?: number;
  category?: string;
  is_veg?: boolean;
  is_surprise_bag?: boolean;
  is_available?: boolean;
  image_url?: string;
}) {
  const { data, error } = await supabase
    .from("menu_items")
    .insert([
      {
        restaurant_id: item.restaurant_id,
        name: item.name,
        description: item.description || null,
        price: item.price,
        original_price: item.original_price || item.price,
        quantity: item.quantity ?? 10,
        category: item.category || "Main Course",
        is_veg: item.is_veg ?? false,
        is_surprise_bag: item.is_surprise_bag ?? false,
        is_available: item.is_available ?? true,
        image_url: item.image_url || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export type AdRow = {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  redirect_link: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
};

export type MenuItemHistoryRow = {
  id: string;
  menu_item_id: string | null;
  restaurant_id: string;
  action: "created" | "updated" | "quantity_updated" | "deleted";
  source: "seller" | "admin" | "system";
  change_note: string | null;
  created_at: string;
  restaurants?: { name: string } | null;
  menu_items?: { name: string } | null;
  changed_by_profile?: { full_name: string | null; email: string | null } | null;
};

export async function fetchAds() {
  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as AdRow[];
}

export async function createAd(ad: {
  title?: string;
  description?: string;
  image_url: string;
  redirect_link?: string;
  display_order?: number;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("ads")
    .insert([
      {
        ...ad,
        created_by: user?.id,
        is_active: true,
        display_order: ad.display_order ?? 0,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleAdActive(adId: string, isActive: boolean) {
  const { error } = await supabase
    .from("ads")
    .update({ is_active: isActive })
    .eq("id", adId);

  if (error) throw error;
  return true;
}

export async function deleteAd(adId: string) {
  const { error } = await supabase.from("ads").delete().eq("id", adId);
  if (error) throw error;
  return true;
}

export async function createCoupon(coupon: {
  code: string;
  description?: string;
  discount: number;
  discount_type: "percentage" | "fixed";
  min_order?: number;
  max_discount?: number;
  expires_at: string;
}) {
  const { data, error } = await supabase
    .from("coupons")
    .insert([
      {
        code: coupon.code.toUpperCase().trim(),
        description: coupon.description || null,
        discount: coupon.discount,
        discount_type: coupon.discount_type,
        min_order: coupon.min_order ?? 0,
        max_discount: coupon.max_discount || null,
        expires_at: coupon.expires_at,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchMenuItemHistory() {
  const { data, error } = await supabase
    .from("menu_item_history")
    .select("*, restaurants(name), menu_items(name), changed_by_profile:profiles!menu_item_history_changed_by_fkey(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return (data || []) as MenuItemHistoryRow[];
}

export type ReviewRow = {
  id: string;
  order_id: string;
  user_id: string;
  restaurant_id: string;
  rating: number;
  comment: string | null;
  defect_image_url: string | null;
  created_at: string;
  restaurants?: { name: string } | null;
  profiles?: { full_name: string | null; email: string | null } | null;
};

export type RestaurantRestrictionRow = {
  id: string;
  restaurant_id: string;
  restriction_type: "no_menu_add" | "suspended" | "limited";
  reason: string | null;
  is_active: boolean;
  restricted_at: string;
  restricted_until: string | null;
  restaurants?: { name: string } | null;
};

export async function fetchReviews() {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, restaurants(name), profiles:user_id(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [] as ReviewRow[];
  return (data || []) as ReviewRow[];
}

export async function fetchRestaurantRestrictions() {
  const { data, error } = await supabase
    .from("restaurant_restrictions")
    .select("*, restaurants(name)")
    .eq("is_active", true)
    .order("restricted_at", { ascending: false });

  if (error) return [] as RestaurantRestrictionRow[];
  return (data || []) as RestaurantRestrictionRow[];
}


