"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchPlatformStats,
  fetchRestaurants,
  fetchOrders,
  fetchSurpriseBags,
  fetchMenuRequests,
  fetchProfiles,
  fetchCoupons,
  fetchAds,
  fetchMenuItemHistory,
  verifyRestaurant,
  updateOrderStatus,
  toggleSurpriseBagStock,
  updateMenuRequestStatus,
  updateUserRole,
  toggleCouponActive,
  toggleAdActive,
  deleteAd,
  RestaurantRow,
  OrderRow,
  SurpriseBagRow,
  MenuRequestRow,
  AdminUser,
  CouponRow,
  AdRow,
  MenuItemHistoryRow,
  ReviewRow,
  RestaurantRestrictionRow,
  fetchReviews,
  fetchRestaurantRestrictions,
} from "@/lib/admin-api";
import AdminLogin from "@/components/AdminLogin";
import AddItemModal from "@/components/AddItemModal";
import AddCouponModal from "@/components/AddCouponModal";
import AddAdModal from "@/components/AddAdModal";
import SellerRevenueCalculator from "@/components/SellerRevenueCalculator";
import { TablePagination } from "@/components/TablePagination";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  Users,
  ShieldCheck,
  Sparkles,
  FileText,
  DollarSign,
  RefreshCw,
  LogOut,
  Tag,
  Check,
  X,
  ExternalLink,
  TrendingUp,
  Image as ImageIcon,
  History,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Package,
  ArrowUpRight,
  ShieldAlert,
  ChevronDown,
  User,
  Menu,
  MapPin,
  BarChart3,
  Activity,
  Star,
  HeartHandshake,
  Flame,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function AdminPortal() {
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState<any>({
    restaurantCount: 0,
    totalOrders: 0,
    userCount: 0,
    activeOrders: 0,
    totalRevenue: 0,
    bagsCount: 0,
  });

  // Real Database entities
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderFilter, setOrderFilter] = useState("all");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [surpriseBags, setSurpriseBags] = useState<SurpriseBagRow[]>([]);
  const [menuRequests, setMenuRequests] = useState<MenuRequestRow[]>([]);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [history, setHistory] = useState<MenuItemHistoryRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [restrictions, setRestrictions] = useState<RestaurantRestrictionRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAddressRestaurant, setSelectedAddressRestaurant] = useState<RestaurantRow | null>(null);

  // Pagination states (Default 50 rows, option for 100)
  const [pageSize, setPageSize] = useState<number>(50);
  const [pageOrders, setPageOrders] = useState<number>(1);
  const [pageRestaurants, setPageRestaurants] = useState<number>(1);
  const [pageBags, setPageBags] = useState<number>(1);
  const [pageUsers, setPageUsers] = useState<number>(1);
  const [pageHistory, setPageHistory] = useState<number>(1);

  // Check Supabase authentication & Admin authorization
  useEffect(() => {
    const verifyUser = async (currentSession: any) => {
      if (!currentSession?.user) {
        setSession(null);
        setCheckingAuth(false);
        return;
      }

      // Check profiles table for admin authorization
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_admin")
        .eq("id", currentSession.user.id)
        .single();

      const isAdmin = profile?.is_admin === true || profile?.role === "admin" || profile?.role === "sub_admin";
      if (!isAdmin) {
        await supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(currentSession);
      }
      setCheckingAuth(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      verifyUser(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      verifyUser(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        statsData,
        restData,
        ordersData,
        bagsData,
        requestsData,
        profilesData,
        couponsData,
        adsData,
        historyData,
        reviewsData,
        restrictionsData,
      ] = await Promise.allSettled([
        fetchPlatformStats(),
        fetchRestaurants(),
        fetchOrders(orderFilter),
        fetchSurpriseBags(),
        fetchMenuRequests(),
        fetchProfiles(),
        fetchCoupons(),
        fetchAds(),
        fetchMenuItemHistory(),
        fetchReviews(),
        fetchRestaurantRestrictions(),
      ]);

      if (statsData.status === "fulfilled") setStats(statsData.value);
      if (restData.status === "fulfilled") setRestaurants(restData.value);
      if (ordersData.status === "fulfilled") setOrders(ordersData.value);
      if (bagsData.status === "fulfilled") setSurpriseBags(bagsData.value);
      if (requestsData.status === "fulfilled") setMenuRequests(requestsData.value);
      if (profilesData.status === "fulfilled") setUsers(profilesData.value);
      if (couponsData.status === "fulfilled") setCoupons(couponsData.value);
      if (adsData.status === "fulfilled") setAds(adsData.value);
      if (historyData.status === "fulfilled") setHistory(historyData.value);
      if (reviewsData.status === "fulfilled") setReviews(reviewsData.value);
      if (restrictionsData.status === "fulfilled") setRestrictions(restrictionsData.value);
    } catch (err) {
      console.error("Error syncing with DB:", err);
    } finally {
      setLoading(false);
    }
  }, [orderFilter]);

  useEffect(() => {
    if (session) {
      loadAllData();
    }
  }, [session, loadAllData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Actions
  const handleVerifyOutlet = async (id: string, approve: boolean) => {
    try {
      await verifyRestaurant(id, approve);
      setRestaurants((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_verified: approve } : r))
      );
    } catch (err: any) {
      alert("Failed to update outlet verification: " + err.message);
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: any) => {
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    } catch (err: any) {
      alert("Failed to update order status: " + err.message);
    }
  };

  const handleToggleBag = async (bagId: string, currentVal: boolean) => {
    try {
      await toggleSurpriseBagStock(bagId, !currentVal);
      setSurpriseBags((prev) =>
        prev.map((b) => (b.id === bagId ? { ...b, is_available: !currentVal } : b))
      );
    } catch (err: any) {
      alert("Failed to update bag stock: " + err.message);
    }
  };

  const handleMenuRequestAction = async (id: string, status: "completed" | "rejected") => {
    try {
      await updateMenuRequestStatus(id, status);
      setMenuRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch (err: any) {
      alert("Failed to update menu request: " + err.message);
    }
  };

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const nextRole =
      currentRole === "customer"
        ? "owner"
        : currentRole === "owner"
        ? "sub_admin"
        : currentRole === "sub_admin"
        ? "admin"
        : "customer";
    try {
      await updateUserRole(userId, nextRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u))
      );
    } catch (err: any) {
      alert("Failed to update role: " + err.message);
    }
  };

  const handleToggleCoupon = async (couponId: string, currentActive: boolean) => {
    try {
      await toggleCouponActive(couponId, !currentActive);
      setCoupons((prev) =>
        prev.map((c) => (c.id === couponId ? { ...c, is_active: !currentActive } : c))
      );
    } catch (err: any) {
      alert("Failed to toggle coupon: " + err.message);
    }
  };

  const handleToggleAd = async (adId: string, currentActive: boolean) => {
    try {
      await toggleAdActive(adId, !currentActive);
      setAds((prev) =>
        prev.map((a) => (a.id === adId ? { ...a, is_active: !currentActive } : a))
      );
    } catch (err: any) {
      alert("Failed to toggle banner: " + err.message);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!confirm("Are you sure you want to delete this promotional banner?")) return;
    try {
      await deleteAd(adId);
      setAds((prev) => prev.filter((a) => a.id !== adId));
    } catch (err: any) {
      alert("Failed to delete banner: " + err.message);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-emerald-500" /> Checking authentication...
      </div>
    );
  }

  if (!session) {
    return <AdminLogin onSuccess={() => {}} />;
  }

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, count: null },
    { id: "restaurants", label: "Restaurants", icon: Store, count: restaurants.length },
    { id: "orders", label: "Orders", icon: ShoppingBag, count: orders.length },
    { id: "surprise-bags", label: "Surprise Bags", icon: Sparkles, count: surpriseBags.length },
    { id: "menu-requests", label: "Digitization", icon: FileText, count: menuRequests.length },
    { id: "users", label: "Users & Staff", icon: Users, count: users.length },
    { id: "coupons", label: "Coupons", icon: Tag, count: coupons.length },
    { id: "ads", label: "Banners / Ads", icon: ImageIcon, count: ads.length },
    { id: "revenue", label: "Revenue & Payouts", icon: TrendingUp, count: null },
    { id: "history", label: "Menu Audit Log", icon: History, count: null },
    { id: "finance", label: "Seller Banking", icon: DollarSign, count: null },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 flex font-sans overflow-x-hidden w-full">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-neutral-900 text-white font-extrabold flex items-center justify-center border border-neutral-800 text-base shadow-xs">
              Z
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-neutral-900 text-base">ZeroZaya</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                Admin Console
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live sync pill badge */}
        <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-[11px] text-neutral-600">
          <span className="flex items-center gap-1.5 font-medium text-neutral-800">
            <span className="h-2 w-2 rounded-full bg-neutral-900 animate-pulse" /> Live DB Synced
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-[11px] text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
            onClick={loadAllData}
            disabled={loading}
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} /> Sync
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="px-3 pt-2 pb-1.5 text-[10px] uppercase font-bold tracking-wider text-neutral-400">
            Platform Modules
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-neutral-500"}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== null && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 border ${
                      isActive
                        ? "bg-neutral-800 text-white border-neutral-700"
                        : "border-neutral-200 text-neutral-600 bg-neutral-100"
                    }`}
                  >
                    {item.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="p-3 border-t border-neutral-200 bg-neutral-50">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-neutral-200/60 border border-neutral-200 transition-all outline-none bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar size="sm" className="bg-neutral-900 text-white border border-neutral-800 text-xs font-bold shrink-0">
                  <AvatarFallback>
                    {session.user.email?.slice(0, 2).toUpperCase() || "AD"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left truncate">
                  <p className="text-xs font-medium text-neutral-900 truncate">{session.user.email}</p>
                  <p className="text-[10px] text-neutral-500">Super Administrator</p>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56 bg-white border-neutral-200 text-neutral-900 mb-2 shadow-lg">
              <DropdownMenuLabel className="text-xs font-normal text-neutral-500">
                Signed in as
                <p className="font-semibold text-neutral-900 truncate mt-0.5">{session.user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-neutral-200" />
              <DropdownMenuItem
                onClick={() => setActiveTab("users")}
                className="text-xs cursor-pointer hover:bg-neutral-100 focus:bg-neutral-100 text-neutral-800"
              >
                <User className="w-3.5 h-3.5 mr-2 text-neutral-500" /> Manage Staff / Users
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveTab("finance")}
                className="text-xs cursor-pointer hover:bg-neutral-100 focus:bg-neutral-100 text-neutral-800"
              >
                <DollarSign className="w-3.5 h-3.5 mr-2 text-neutral-500" /> Seller Banking
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-neutral-200" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-xs cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 w-full overflow-x-hidden">
        {/* Top Navbar */}
        <header className="border-b border-neutral-200 bg-white/80 backdrop-blur px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 w-full">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200 shrink-0"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-sm font-bold text-neutral-900 capitalize truncate">
                {navItems.find((n) => n.id === activeTab)?.label || "Dashboard"}
              </h1>
              <span className="text-neutral-300 hidden sm:inline">•</span>
              <span className="text-xs text-neutral-500 hidden sm:inline truncate">ZeroZaya Administration</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 h-8 text-xs"
              onClick={loadAllData}
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:mr-1.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Sync Database</span>
              <span className="sm:hidden">Sync</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 h-8 text-xs px-2 sm:px-2.5"
              onClick={handleLogout}
            >
              <LogOut className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Tab Body View */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full min-w-0">
            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
            {/* Top Key Metric Cards */}
            {(() => {
              const totalRevenue = orders.reduce((sum, o) => (o.status === "completed" ? sum + (Number(o.total_amount) || 0) : sum), 0);
              const pendingOrdersCount = orders.filter((o) => o.status === "pending").length;
              const completedOrdersCount = orders.filter((o) => o.status === "completed").length;
              const confirmedOrdersCount = orders.filter((o) => o.status === "confirmed").length;
              const cancelledOrdersCount = orders.filter((o) => o.status === "cancelled").length;
              const totalOrdersCount = orders.length || 1;
              const fulfillmentRate = Math.round((completedOrdersCount / totalOrdersCount) * 100);

              const verifiedOutlets = restaurants.filter((r) => r.is_verified).length;
              const unverifiedOutlets = restaurants.filter((r) => !r.is_verified).length;
              const pendingKYCOutlets = restaurants.filter((r) => !r.is_verified && r.id_proof_url).length;

              const activeBags = surpriseBags.filter((b) => b.is_available).length;
              const totalBags = surpriseBags.length;
              const pendingMenuRequests = menuRequests.filter((r) => r.status === "pending").length;
              const adminCount = users.filter((u) => u.is_admin || u.role === "admin" || u.role === "sub_admin").length;
              // Past 7 Days daily metrics for Chart
              const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                const dateStr = d.toISOString().split("T")[0];
                const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short" });

                const dayOrders = orders.filter((o) => o.created_at && o.created_at.startsWith(dateStr));
                const dayRevenue = dayOrders.reduce(
                  (sum, o) => (o.status === "completed" ? sum + (Number(o.total_amount) || 0) : sum),
                  0
                );
                return { dateStr, dayLabel, ordersCount: dayOrders.length, revenue: dayRevenue };
              });

              const maxDailyOrders = Math.max(...last7Days.map((d) => d.ordersCount), 1);
              const maxDailyRevenue = Math.max(...last7Days.map((d) => d.revenue), 100);

              // Top 4 Outlets by order count
              const outletCounts = restaurants.map((r) => {
                const count = orders.filter((o) => o.restaurant_id === r.id).length;
                return { name: r.name, count, type: r.seller_type || "restaurant" };
              }).sort((a, b) => b.count - a.count).slice(0, 4);
              const maxOutletCount = Math.max(...outletCounts.map((o) => o.count), 1);

              // Enhanced operational metrics from schema
              const aov = completedOrdersCount > 0 ? Math.round(totalRevenue / completedOrdersCount) : 0;
              
              // Total Food / Surplus Waste Diverted (from surprise bags original vs price difference)
              const totalSavingsEstimated = surpriseBags.reduce((sum, b) => {
                const diff = (Number(b.original_price) || Number(b.price)) - Number(b.price);
                return sum + (diff > 0 ? diff * (b.quantity || 1) : 0);
              }, 0);

              // Platform CSAT / Rating from reviews
              const avgRating = reviews.length > 0
                ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
                : "4.8";

              // Meal Rush / Peak Hours
              const hourBuckets = { lunch: 0, snacks: 0, dinner: 0, late: 0 };
              orders.forEach((o) => {
                if (!o.created_at) return;
                const hr = new Date(o.created_at).getHours();
                if (hr >= 11 && hr < 16) hourBuckets.lunch += 1;
                else if (hr >= 16 && hr < 19) hourBuckets.snacks += 1;
                else if (hr >= 19 && hr < 23) hourBuckets.dinner += 1;
                else hourBuckets.late += 1;
              });

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Revenue Card */}
                    <Card className="bg-white border-neutral-200 relative overflow-hidden group hover:border-neutral-900 transition-all shadow-xs">
                      <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign className="w-16 h-16 text-neutral-900" />
                      </div>
                      <CardHeader className="pb-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs uppercase text-neutral-500 font-semibold tracking-wider">Gross Revenue</CardTitle>
                          <span className="p-1 rounded-md bg-neutral-100 text-neutral-900 border border-neutral-200">
                            <TrendingUp className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-extrabold text-neutral-900 tracking-tight">₹{totalRevenue.toLocaleString("en-IN")}</div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-neutral-600 font-medium">
                          <span>{completedOrdersCount} orders</span>
                          <span className="text-neutral-300">•</span>
                          <span className="text-neutral-900 font-semibold">₹{aov} AOV</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Orders Status Card */}
                    <Card className="bg-white border-neutral-200 relative overflow-hidden group hover:border-neutral-900 transition-all shadow-xs">
                      <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShoppingBag className="w-16 h-16 text-neutral-900" />
                      </div>
                      <CardHeader className="pb-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs uppercase text-neutral-500 font-semibold tracking-wider">Orders Pipeline</CardTitle>
                          <span className="p-1 rounded-md bg-neutral-100 text-neutral-900 border border-neutral-200">
                            <Package className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-extrabold text-neutral-900 tracking-tight">{orders.length}</div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs">
                          <span className="text-neutral-900 font-semibold">{pendingOrdersCount} pending</span>
                          <span className="text-neutral-300">•</span>
                          <span className="text-neutral-600">{fulfillmentRate}% success</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Outlets KYC Card */}
                    <Card className="bg-white border-neutral-200 relative overflow-hidden group hover:border-neutral-900 transition-all shadow-xs">
                      <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Store className="w-16 h-16 text-neutral-900" />
                      </div>
                      <CardHeader className="pb-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs uppercase text-neutral-500 font-semibold tracking-wider">Restaurants / KYC</CardTitle>
                          <span className="p-1 rounded-md bg-neutral-100 text-neutral-900 border border-neutral-200">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-extrabold text-neutral-900 tracking-tight">{restaurants.length}</div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs">
                          <span className="text-neutral-900 font-semibold">{verifiedOutlets} verified</span>
                          <span className="text-neutral-300">•</span>
                          <span className={pendingKYCOutlets > 0 ? "text-neutral-900 font-semibold" : "text-neutral-500"}>
                            {pendingKYCOutlets} KYC review
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Food Rescue & Sustainability Impact Card */}
                    <Card className="bg-white border-neutral-200 relative overflow-hidden group hover:border-neutral-900 transition-all shadow-xs">
                      <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                        <HeartHandshake className="w-16 h-16 text-neutral-900" />
                      </div>
                      <CardHeader className="pb-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs uppercase text-neutral-500 font-semibold tracking-wider">Food Rescued Impact</CardTitle>
                          <span className="p-1 rounded-md bg-neutral-100 text-neutral-900 border border-neutral-200">
                            <Sparkles className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-extrabold text-neutral-900 tracking-tight">₹{totalSavingsEstimated.toLocaleString("en-IN")}</div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs">
                          <span className="text-neutral-900 font-semibold">{activeBags} active bags</span>
                          <span className="text-neutral-300">•</span>
                          <span className="text-neutral-500">Student savings pool</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* VISUAL CHARTS ROW */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 7-Day Order Volume Bar Chart */}
                    <Card className="bg-white border-neutral-200 p-5 space-y-4 shadow-xs lg:col-span-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                        <div className="space-y-0.5">
                          <h3 className="font-semibold text-neutral-900 text-sm flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-neutral-900" /> 7-Day Orders & Revenue Velocity
                          </h3>
                          <p className="text-xs text-neutral-500">Daily order intake and revenue over the last 7 calendar days</p>
                        </div>
                        <Badge variant="outline" className="border-neutral-300 bg-neutral-50 text-neutral-700 text-xs w-fit">
                          Past 7 Days
                        </Badge>
                      </div>

                      <div className="pt-2">
                        {/* Custom SVG Bar & Trend Chart */}
                        <div className="h-44 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6 pb-2 border-b border-neutral-200 bg-neutral-50/50 rounded-lg">
                          {last7Days.map((day) => {
                            const barHeightPercent = Math.max(8, Math.round((day.ordersCount / maxDailyOrders) * 100));
                            return (
                              <div key={day.dateStr} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                                {/* Tooltip hover */}
                                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white text-[10px] px-2 py-1 rounded shadow-md pointer-events-none whitespace-nowrap z-20">
                                  {day.ordersCount} orders • ₹{day.revenue}
                                </div>
                                <div className="w-full max-w-[36px] flex flex-col items-center justify-end h-full">
                                  <div
                                    style={{ height: `${barHeightPercent}%` }}
                                    className="w-full rounded-t-md bg-neutral-900 group-hover:bg-neutral-700 transition-all duration-300 flex items-center justify-center"
                                  >
                                    {barHeightPercent > 25 && (
                                      <span className="text-[10px] text-white font-mono font-bold">
                                        {day.ordersCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="text-[11px] font-medium text-neutral-600 mt-2">
                                  {day.dayLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 px-1">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-neutral-900" /> Order volume per day
                          </span>
                          <span>Max peak: {maxDailyOrders} orders/day</span>
                        </div>
                      </div>
                    </Card>

                    {/* Top Performing Outlets Bar Distribution */}
                    <Card className="bg-white border-neutral-200 p-5 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                        <div className="space-y-0.5">
                          <h3 className="font-semibold text-neutral-900 text-sm flex items-center gap-2">
                            <Activity className="w-4 h-4 text-neutral-900" /> Merchant Activity
                          </h3>
                          <p className="text-xs text-neutral-500">Order share across top campus outlets</p>
                        </div>
                        <span className="p-1 rounded-md bg-neutral-100 text-neutral-900 border border-neutral-200">
                          <Store className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      <div className="space-y-3 pt-1">
                        {outletCounts.length === 0 ? (
                          <p className="text-xs text-neutral-500 text-center py-6">No merchant order volume recorded yet.</p>
                        ) : (
                          outletCounts.map((outlet, idx) => {
                            const percent = Math.round((outlet.count / maxOutletCount) * 100);
                            return (
                              <div key={outlet.name + idx} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium text-neutral-900 truncate max-w-[140px]" title={outlet.name}>
                                    {outlet.name}
                                  </span>
                                  <span className="font-mono text-neutral-600 font-semibold">{outlet.count} orders</span>
                                </div>
                                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                                  <div
                                    style={{ width: `${percent}%` }}
                                    className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Secondary Analytical Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Fulfillment Breakdown */}
                    <Card className="bg-white border-neutral-200 p-5 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                        <div className="space-y-0.5">
                          <h3 className="font-semibold text-neutral-900 text-sm flex items-center gap-2">
                            <Package className="w-4 h-4 text-neutral-900" /> Order Fulfillment Status
                          </h3>
                          <p className="text-xs text-neutral-500">Real-time split of all platform orders</p>
                        </div>
                        <Badge variant="outline" className="border-neutral-300 bg-neutral-50 text-neutral-700 text-xs">
                          {orders.length} Total
                        </Badge>
                      </div>

                      {/* Visual segmented bar */}
                      <div className="space-y-1.5">
                        <div className="h-2.5 w-full bg-neutral-200 rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${(completedOrdersCount / totalOrdersCount) * 100}%` }}
                            className="bg-neutral-900 transition-all duration-500"
                            title={`Completed: ${completedOrdersCount}`}
                          />
                          <div
                            style={{ width: `${(confirmedOrdersCount / totalOrdersCount) * 100}%` }}
                            className="bg-neutral-600 transition-all duration-500"
                            title={`Confirmed: ${confirmedOrdersCount}`}
                          />
                          <div
                            style={{ width: `${(pendingOrdersCount / totalOrdersCount) * 100}%` }}
                            className="bg-neutral-400 transition-all duration-500"
                            title={`Pending: ${pendingOrdersCount}`}
                          />
                          <div
                            style={{ width: `${(cancelledOrdersCount / totalOrdersCount) * 100}%` }}
                            className="bg-neutral-300 transition-all duration-500"
                            title={`Cancelled: ${cancelledOrdersCount}`}
                          />
                        </div>
                      </div>

                      {/* Detailed Metric Rows */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-md bg-neutral-50 border border-neutral-200">
                          <span className="flex items-center gap-2 text-neutral-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900" /> Completed
                          </span>
                          <span className="font-bold text-neutral-900">{completedOrdersCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-md bg-neutral-50 border border-neutral-200">
                          <span className="flex items-center gap-2 text-neutral-700">
                            <Clock className="w-3.5 h-3.5 text-neutral-600" /> Confirmed
                          </span>
                          <span className="font-bold text-neutral-900">{confirmedOrdersCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-md bg-neutral-50 border border-neutral-200">
                          <span className="flex items-center gap-2 text-neutral-700">
                            <AlertCircle className="w-3.5 h-3.5 text-neutral-600" /> Pending Action
                          </span>
                          <span className="font-bold text-neutral-900">{pendingOrdersCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-md bg-neutral-50 border border-neutral-200">
                          <span className="flex items-center gap-2 text-neutral-700">
                            <XCircle className="w-3.5 h-3.5 text-neutral-400" /> Cancelled
                          </span>
                          <span className="font-bold text-neutral-600">{cancelledOrdersCount}</span>
                        </div>
                      </div>
                    </Card>

                    {/* Pending Action & Operations Hub */}
                    <Card className="bg-white border-neutral-200 p-5 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                        <div className="space-y-0.5">
                          <h3 className="font-semibold text-neutral-900 text-sm flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-neutral-900" /> Operations Action Center
                          </h3>
                          <p className="text-xs text-neutral-500">Items requiring admin attention</p>
                        </div>
                        {(pendingKYCOutlets > 0 || pendingMenuRequests > 0) && (
                          <Badge className="bg-neutral-900 text-white text-xs border border-neutral-800">
                            {pendingKYCOutlets + pendingMenuRequests} Pending
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-3">
                        {/* Restaurant KYC Alert */}
                        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-neutral-900" /> Restaurant KYC
                              </span>
                              <p className="text-xs text-neutral-600">
                                {pendingKYCOutlets > 0
                                  ? `${pendingKYCOutlets} outlet(s) with uploaded ID documents`
                                  : "All uploaded KYC documents resolved"}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActiveTab("restaurants")}
                              className="h-7 text-xs border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100"
                            >
                              Review <ArrowUpRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>

                        {/* Menu OCR Alert */}
                        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-neutral-900" /> Menu Digitization
                              </span>
                              <p className="text-xs text-neutral-600">
                                {pendingMenuRequests > 0
                                  ? `${pendingMenuRequests} menu upload(s) pending verification`
                                  : "Zero pending digitization queues"}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActiveTab("menu-requests")}
                              className="h-7 text-xs border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100"
                            >
                              Inspect <ArrowUpRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>

                        {/* Restaurant Restrictions & Suspensions */}
                        {restrictions.length > 0 && (
                          <div className="p-3 rounded-lg bg-neutral-100 border border-neutral-300 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 text-neutral-900" /> Active Restrictions ({restrictions.length})
                              </span>
                              <Badge variant="outline" className="border-neutral-400 bg-white text-neutral-800 text-[10px]">
                                Vendor Action
                              </Badge>
                            </div>
                            <p className="text-xs text-neutral-600">
                              {restrictions.map((rst) => rst.restaurants?.name || "Merchant").join(", ")} restricted ({restrictions[0]?.restriction_type})
                            </p>
                          </div>
                        )}

                        {/* Platform Users Summary */}
                        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-neutral-900" /> User Roles & Access
                            </span>
                            <p className="text-xs text-neutral-600">
                              {users.length} profiles ({adminCount} Admins / Staff)
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveTab("users")}
                            className="h-7 text-xs border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100"
                          >
                            Manage <ArrowUpRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </Card>

                    {/* Quick Highlights / Mini Health */}
                    <Card className="bg-white border-neutral-200 p-5 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                        <div className="space-y-0.5">
                          <h3 className="font-semibold text-neutral-900 text-sm flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-neutral-900" /> System Pulse & Experience
                          </h3>
                          <p className="text-xs text-neutral-500">CSAT, rush periods & operational health</p>
                        </div>
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neutral-900"></span>
                        </span>
                      </div>

                      <div className="space-y-3">
                        {/* CSAT / Review Score */}
                        <div className="flex items-center justify-between p-2.5 rounded-md bg-neutral-50 border border-neutral-200">
                          <span className="text-xs text-neutral-600 flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-neutral-900 fill-neutral-900" /> Platform CSAT Rating
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-neutral-900">{avgRating} / 5.0</span>
                            <span className="text-[10px] text-neutral-500">({reviews.length || "0"} reviews)</span>
                          </div>
                        </div>

                        {/* Rush Hours Distribution */}
                        <div className="p-2.5 rounded-md bg-neutral-50 border border-neutral-200 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-600 flex items-center gap-1.5">
                              <Flame className="w-3.5 h-3.5 text-neutral-900" /> Peak Order Windows
                            </span>
                            <span className="font-mono text-neutral-900 font-semibold text-[11px]">
                              {hourBuckets.lunch >= hourBuckets.dinner ? "Lunch Rush" : "Dinner Rush"}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 text-center pt-0.5">
                            <div className="p-1 rounded bg-white border border-neutral-200 text-[10px]">
                              <p className="text-neutral-500">Lunch</p>
                              <p className="font-bold text-neutral-900">{hourBuckets.lunch}</p>
                            </div>
                            <div className="p-1 rounded bg-white border border-neutral-200 text-[10px]">
                              <p className="text-neutral-500">Snacks</p>
                              <p className="font-bold text-neutral-900">{hourBuckets.snacks}</p>
                            </div>
                            <div className="p-1 rounded bg-white border border-neutral-200 text-[10px]">
                              <p className="text-neutral-500">Dinner</p>
                              <p className="font-bold text-neutral-900">{hourBuckets.dinner}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-md bg-neutral-50 border border-neutral-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-600">Verified Partner Outlets</span>
                            <span className="text-xs font-bold text-neutral-900">
                              {verifiedOutlets} / {restaurants.length} ({restaurants.length ? Math.round((verifiedOutlets / restaurants.length) * 100) : 0}%)
                            </span>
                          </div>
                          <Progress
                            value={restaurants.length ? Math.round((verifiedOutlets / restaurants.length) * 100) : 0}
                            className="h-1.5 bg-neutral-200"
                          />
                        </div>

                        <div className="p-2.5 rounded-md bg-neutral-50 border border-neutral-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-600">Surprise Bags Available</span>
                            <span className="text-xs font-bold text-neutral-900">
                              {activeBags} / {totalBags} in stock
                            </span>
                          </div>
                          <Progress
                            value={totalBags ? Math.round((activeBags / totalBags) * 100) : 0}
                            className="h-1.5 bg-neutral-200"
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-md bg-neutral-50 border border-neutral-200">
                          <span className="text-xs text-neutral-600">Active Coupons</span>
                          <span className="text-xs font-bold text-neutral-900">
                            {coupons.filter((c) => c.is_active).length} / {coupons.length}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Recent Orders Activity Table on Overview */}
                  <Card className="bg-white border-neutral-200 shadow-xs">
                    <CardHeader className="pb-3 border-b border-neutral-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-semibold text-neutral-900">Recent Orders Stream</CardTitle>
                          <CardDescription className="text-xs text-neutral-500">
                            Latest activity across campus & restaurants
                          </CardDescription>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveTab("orders")}
                          className="h-7 text-xs border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
                        >
                          View All Orders <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="border-neutral-200 bg-neutral-50">
                          <TableRow className="border-neutral-200">
                            <TableHead className="text-neutral-600 text-xs">Order ID</TableHead>
                            <TableHead className="text-neutral-600 text-xs">Customer</TableHead>
                            <TableHead className="text-neutral-600 text-xs">Outlet</TableHead>
                            <TableHead className="text-neutral-600 text-xs">Amount</TableHead>
                            <TableHead className="text-neutral-600 text-xs">Status</TableHead>
                            <TableHead className="text-neutral-600 text-xs text-right">Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.slice(0, 5).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-neutral-500 py-6 text-xs">
                                No recent orders recorded.
                              </TableCell>
                            </TableRow>
                          ) : (
                            orders.slice(0, 5).map((o) => (
                              <TableRow key={o.id} className="border-neutral-200 hover:bg-neutral-50">
                                <TableCell className="font-mono text-xs text-neutral-600">#{o.id.slice(0, 8)}</TableCell>
                                <TableCell className="text-xs text-neutral-900 font-medium">
                                  {o.profiles?.full_name || o.profiles?.email || "Customer"}
                                </TableCell>
                                <TableCell className="text-xs text-neutral-600">{o.restaurants?.name || "Vendor"}</TableCell>
                                <TableCell className="text-xs font-semibold text-neutral-900">₹{o.total_amount}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      o.status === "completed"
                                        ? "bg-neutral-900 text-white border border-neutral-900 text-[11px]"
                                        : o.status === "confirmed"
                                        ? "bg-neutral-200 text-neutral-900 border border-neutral-300 text-[11px]"
                                        : o.status === "pending"
                                        ? "bg-neutral-100 text-neutral-800 border border-neutral-300 text-[11px]"
                                        : "bg-white text-neutral-500 border border-neutral-300 text-[11px]"
                                    }
                                  >
                                    {o.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-xs text-neutral-500">
                                  {o.created_at ? new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </TabsContent>

          {/* RESTAURANTS TAB */}
          <TabsContent value="restaurants" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Restaurants & Outlets</h2>
                <p className="text-xs text-neutral-500">Verified status, owner link, and outlet configuration</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <Input
                  placeholder="Search restaurant..."
                  className="w-full sm:w-56 bg-white border-neutral-300 text-neutral-900 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <AddItemModal restaurants={restaurants} onItemAdded={loadAllData} />
              </div>
            </div>

            <Card className="bg-white border-neutral-200 shadow-xs">
              <Table>
                <TableHeader className="border-neutral-200 bg-neutral-50">
                  <TableRow className="border-neutral-200">
                    <TableHead className="text-neutral-600 text-xs">Outlet Name</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Owner</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Type / Address</TableHead>
                    <TableHead className="text-neutral-600 text-xs">ID Proof</TableHead>
                    <TableHead className="text-neutral-600 text-xs">KYC Status</TableHead>
                    <TableHead className="text-neutral-600 text-xs text-right">Verification Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const filtered = restaurants.filter(
                      (r) => !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    const paginated = filtered.slice((pageRestaurants - 1) * pageSize, pageRestaurants * pageSize);

                    if (filtered.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-neutral-500 py-8 text-xs">
                            No restaurants found.
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return paginated.map((r) => (
                      <TableRow key={r.id} className="border-neutral-200 hover:bg-neutral-50">
                        <TableCell className="font-medium text-neutral-900 text-xs">{r.name}</TableCell>
                        <TableCell className="text-xs text-neutral-600">
                          {r.owner?.full_name || r.owner?.email || "No Owner Assigned"}
                        </TableCell>
                        <TableCell className="text-neutral-600 text-xs max-w-[200px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="capitalize font-medium text-neutral-800">{r.seller_type || "restaurant"}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-neutral-600" title={r.address || "Main Campus"}>
                                {r.address || "Main Campus"}
                              </span>
                              {r.address && r.address.length > 25 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedAddressRestaurant(r)}
                                  className="text-[11px] font-semibold text-neutral-900 underline hover:text-neutral-600 shrink-0 cursor-pointer"
                                >
                                  View
                                </button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.id_proof_url ? (
                            <a
                              href={r.id_proof_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-neutral-900 underline font-medium flex items-center gap-1 hover:text-neutral-700"
                            >
                              View {r.id_proof_type || "ID"} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-neutral-400">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={r.is_verified ? "bg-neutral-900 text-white border border-neutral-900 text-[11px]" : "bg-neutral-100 text-neutral-700 border border-neutral-300 text-[11px]"}>
                            {r.is_verified ? "Verified" : "Unverified"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {r.is_verified ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100"
                              onClick={() => handleVerifyOutlet(r.id, false)}
                            >
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-neutral-900 hover:bg-neutral-800 text-white"
                              onClick={() => handleVerifyOutlet(r.id, true)}
                            >
                              Approve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={pageRestaurants}
                totalItems={restaurants.filter((r) => !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase())).length}
                pageSize={pageSize}
                onPageChange={setPageRestaurants}
                onPageSizeChange={setPageSize}
              />
            </Card>

            {/* Address Details Dialog */}
            <Dialog open={!!selectedAddressRestaurant} onOpenChange={(open) => !open && setSelectedAddressRestaurant(null)}>
              <DialogContent className="sm:max-w-md bg-white border border-neutral-200 text-neutral-900 shadow-xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-neutral-900" />
                    {selectedAddressRestaurant?.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-neutral-500">
                    Complete registered address & outlet location details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
                    <span className="text-[11px] uppercase font-semibold tracking-wider text-neutral-500">Outlet Type</span>
                    <p className="text-xs font-medium text-neutral-900 capitalize">
                      {selectedAddressRestaurant?.seller_type || "Restaurant"}
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
                    <span className="text-[11px] uppercase font-semibold tracking-wider text-neutral-500">Full Address</span>
                    <p className="text-xs text-neutral-800 whitespace-pre-wrap leading-relaxed">
                      {selectedAddressRestaurant?.address || "No detailed address provided."}
                    </p>
                  </div>
                  {selectedAddressRestaurant?.owner && (
                    <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
                      <span className="text-[11px] uppercase font-semibold tracking-wider text-neutral-500">Owner Contact</span>
                      <p className="text-xs text-neutral-800">
                        {selectedAddressRestaurant.owner.full_name || "—"} ({selectedAddressRestaurant.owner.email || "No email"})
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800"
                    onClick={() => setSelectedAddressRestaurant(null)}
                  >
                    Close
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ORDERS TAB */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Orders Management</h2>
                <p className="text-xs text-neutral-500">Track and update customer order lifecycle directly in DB</p>
              </div>
              <div className="w-full sm:w-48">
                <Select value={orderFilter} onValueChange={(val) => setOrderFilter(val || "all")}>
                  <SelectTrigger className="w-full sm:w-48 bg-white border-neutral-300 text-neutral-900 text-xs">
                    <SelectValue placeholder="Status filter" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="bg-white border-neutral-200 shadow-xs">
              <Table>
                <TableHeader className="border-neutral-200 bg-neutral-50">
                  <TableRow className="border-neutral-200">
                    <TableHead className="text-neutral-600 text-xs">Order ID</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Customer</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Outlet</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Pickup Code</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Amount</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Status</TableHead>
                    <TableHead className="text-neutral-600 text-xs text-right">Update Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-neutral-500 py-8 text-xs">
                        No orders recorded.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders
                      .slice((pageOrders - 1) * pageSize, pageOrders * pageSize)
                      .map((o) => (
                      <TableRow key={o.id} className="border-neutral-200 hover:bg-neutral-50">
                        <TableCell className="font-mono text-xs text-neutral-600">#{o.id.slice(0, 8)}</TableCell>
                        <TableCell className="text-xs text-neutral-900 font-medium">
                          {o.profiles?.full_name || o.profiles?.email || "Customer"}
                        </TableCell>
                        <TableCell className="text-xs text-neutral-600">{o.restaurants?.name || "Vendor"}</TableCell>
                        <TableCell className="font-mono text-xs text-neutral-900 font-bold bg-neutral-100 px-2 py-0.5 rounded w-fit">{o.pickup_code || "—"}</TableCell>
                        <TableCell className="font-semibold text-neutral-900 text-xs">₹{o.total_amount}</TableCell>
                        <TableCell>
                          <Badge className={
                            o.status === "completed"
                              ? "bg-neutral-900 text-white border border-neutral-900 text-[11px]"
                              : o.status === "confirmed"
                              ? "bg-neutral-200 text-neutral-900 border border-neutral-300 text-[11px]"
                              : o.status === "pending"
                              ? "bg-neutral-100 text-neutral-800 border border-neutral-300 text-[11px]"
                              : "bg-white text-neutral-500 border border-neutral-300 text-[11px]"
                          }>
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={o.status}
                            onValueChange={(val: any) => handleOrderStatusChange(o.id, val)}
                          >
                            <SelectTrigger className="w-32 h-7 bg-white border-neutral-300 text-neutral-900 text-xs ml-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-neutral-200 text-neutral-900 text-xs">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={pageOrders}
                totalItems={orders.length}
                pageSize={pageSize}
                onPageChange={setPageOrders}
                onPageSizeChange={setPageSize}
              />
            </Card>
          </TabsContent>

          {/* SURPRISE BAGS TAB */}
          <TabsContent value="surprise-bags" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Surprise / Rescue Bags (menu_items)</h2>
                <p className="text-xs text-neutral-500">Real items where is_surprise_bag = true</p>
              </div>
              <AddItemModal restaurants={restaurants} onItemAdded={loadAllData} />
            </div>

            <Card className="bg-white border-neutral-200 shadow-xs">
              <Table>
                <TableHeader className="border-neutral-200 bg-neutral-50">
                  <TableRow className="border-neutral-200">
                    <TableHead className="text-neutral-600 text-xs">Bag Title</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Restaurant</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Stock Qty</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Price</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Availability</TableHead>
                    <TableHead className="text-neutral-600 text-xs text-right">Toggle Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surpriseBags.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-neutral-500 py-8 text-xs">
                        No surprise bags listed.
                      </TableCell>
                    </TableRow>
                  ) : (
                    surpriseBags
                      .slice((pageBags - 1) * pageSize, pageBags * pageSize)
                      .map((b) => (
                      <TableRow key={b.id} className="border-neutral-200 hover:bg-neutral-50">
                        <TableCell className="font-medium text-neutral-900 text-xs">{b.name}</TableCell>
                        <TableCell className="text-neutral-600 text-xs">{b.restaurants?.name || "Outlet"}</TableCell>
                        <TableCell className="text-neutral-800 text-xs">{b.quantity}</TableCell>
                        <TableCell className="text-neutral-900 font-bold text-xs">
                          ₹{b.price} <span className="text-xs text-neutral-400 font-normal line-through">₹{b.original_price}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={b.is_available ? "bg-neutral-900 text-white border border-neutral-900 text-[11px]" : "bg-neutral-100 text-neutral-500 border border-neutral-200 text-[11px]"}>
                            {b.is_available ? "In Stock" : "Sold Out"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800"
                            onClick={() => handleToggleBag(b.id, b.is_available)}
                          >
                            {b.is_available ? "Mark Sold Out" : "Enable Stock"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={pageBags}
                totalItems={surpriseBags.length}
                pageSize={pageSize}
                onPageChange={setPageBags}
                onPageSizeChange={setPageSize}
              />
            </Card>
          </TabsContent>

          {/* MENU DIGITIZATION TAB */}
          <TabsContent value="menu-requests" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Menu Uploads (menu_requests)</h2>
                <p className="text-xs text-neutral-500">Photos uploaded by dining partners to digitize</p>
              </div>
            </div>

            <Card className="bg-white border-neutral-200 shadow-xs">
              <Table>
                <TableHeader className="border-neutral-200 bg-neutral-50">
                  <TableRow className="border-neutral-200">
                    <TableHead className="text-neutral-600 text-xs">Request ID</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Restaurant</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Uploaded Image</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Status</TableHead>
                    <TableHead className="text-neutral-600 text-xs text-right">Approval Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-neutral-500 py-8 text-xs">
                        No menu upload requests in database.
                      </TableCell>
                    </TableRow>
                  ) : (
                    menuRequests.map((req) => (
                      <TableRow key={req.id} className="border-neutral-200 hover:bg-neutral-50">
                        <TableCell className="font-mono text-xs text-neutral-600">#{req.id.slice(0, 8)}</TableCell>
                        <TableCell className="text-neutral-900 font-medium text-xs">{req.restaurants?.name || "Partner"}</TableCell>
                        <TableCell>
                          <a
                            href={req.image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-neutral-900 underline font-medium text-xs flex items-center gap-1 hover:text-neutral-700"
                          >
                            Open Menu Photo <ExternalLink className="w-3 h-3" />
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            req.status === "completed"
                              ? "bg-neutral-900 text-white border border-neutral-900 text-[11px]"
                              : req.status === "rejected"
                              ? "bg-neutral-200 text-neutral-600 border border-neutral-300 text-[11px]"
                              : "bg-neutral-100 text-neutral-800 border border-neutral-300 text-[11px]"
                          }>
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {req.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-neutral-900 hover:bg-neutral-800 text-white"
                                onClick={() => handleMenuRequestAction(req.id, "completed")}
                              >
                                <Check className="w-3 h-3 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
                                onClick={() => handleMenuRequestAction(req.id, "rejected")}
                              >
                                <X className="w-3 h-3 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* USERS & ROLES TAB */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">User Profiles & Role Management</h2>
                <p className="text-xs text-neutral-500">Modify user roles directly via profiles table</p>
              </div>
            </div>

            <Card className="bg-white border-neutral-200 shadow-xs">
              <Table>
                <TableHeader className="border-neutral-200 bg-neutral-50">
                  <TableRow className="border-neutral-200">
                    <TableHead className="text-neutral-600 text-xs">User ID</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Full Name</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Email</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Role</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Admin Flag</TableHead>
                    <TableHead className="text-neutral-600 text-xs text-right">Cycle Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-neutral-500 py-8 text-xs">
                        No profiles returned.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users
                      .slice((pageUsers - 1) * pageSize, pageUsers * pageSize)
                      .map((u) => (
                      <TableRow key={u.id} className="border-neutral-200 hover:bg-neutral-50">
                        <TableCell className="font-mono text-xs text-neutral-600">#{u.id.slice(0, 8)}</TableCell>
                        <TableCell className="font-medium text-neutral-900 text-xs">{u.full_name || "—"}</TableCell>
                        <TableCell className="text-xs text-neutral-600">{u.email || "—"}</TableCell>
                        <TableCell>
                          <Badge className="bg-neutral-100 text-neutral-800 border border-neutral-300 capitalize text-[11px]">
                            {u.role || "customer"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.is_admin ? (
                            <Badge className="bg-neutral-900 text-white border border-neutral-900 text-[11px]">Admin</Badge>
                          ) : (
                            <span className="text-xs text-neutral-500">Regular</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800"
                            onClick={() => handleRoleToggle(u.id, u.role)}
                          >
                            Change Role
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={pageUsers}
                totalItems={users.length}
                pageSize={pageSize}
                onPageChange={setPageUsers}
                onPageSizeChange={setPageSize}
              />
            </Card>
          </TabsContent>

          {/* COUPONS TAB */}
          <TabsContent value="coupons" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Promo Codes & Coupons</h2>
                <p className="text-xs text-neutral-500">Sync with coupons table in database</p>
              </div>
              <AddCouponModal onCouponAdded={loadAllData} />
            </div>

            <Card className="bg-white border-neutral-200 shadow-xs">
              <Table>
                <TableHeader className="border-neutral-200 bg-neutral-50">
                  <TableRow className="border-neutral-200">
                    <TableHead className="text-neutral-600 text-xs">Coupon Code</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Description</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Discount</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Expires</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Status</TableHead>
                    <TableHead className="text-neutral-600 text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-neutral-500 py-8 text-xs">
                        No active coupons in database.
                      </TableCell>
                    </TableRow>
                  ) : (
                    coupons.map((c) => (
                      <TableRow key={c.id} className="border-neutral-200 hover:bg-neutral-50">
                        <TableCell className="font-mono font-bold text-neutral-900 text-xs">{c.code}</TableCell>
                        <TableCell className="text-xs text-neutral-600">{c.description || "—"}</TableCell>
                        <TableCell className="text-neutral-900 font-semibold text-xs">
                          {c.discount_type === "percentage" ? `${c.discount}%` : `₹${c.discount}`}
                        </TableCell>
                        <TableCell className="text-xs text-neutral-500">
                          {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell>
                          <Badge className={c.is_active ? "bg-neutral-900 text-white border border-neutral-900 text-[11px]" : "bg-neutral-100 text-neutral-500 border border-neutral-300 text-[11px]"}>
                            {c.is_active ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800"
                            onClick={() => handleToggleCoupon(c.id, c.is_active)}
                          >
                            {c.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* SELLER BANKING TAB */}
          <TabsContent value="finance" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Seller Banking & Settlement Accounts</h2>
                <p className="text-xs text-neutral-500">Live bank details from restaurants table</p>
              </div>
            </div>

            <Card className="bg-white border-neutral-200 shadow-xs">
              <Table>
                <TableHeader className="border-neutral-200 bg-neutral-50">
                  <TableRow className="border-neutral-200">
                    <TableHead className="text-neutral-600 text-xs">Restaurant</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Bank Holder Name</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Bank Name</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Account Number</TableHead>
                    <TableHead className="text-neutral-600 text-xs">IFSC Code</TableHead>
                    <TableHead className="text-neutral-600 text-xs text-right">UPI ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restaurants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-neutral-500 py-8 text-xs">
                        No restaurant banking details available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    restaurants.map((r) => (
                      <TableRow key={r.id} className="border-neutral-200 hover:bg-neutral-50">
                        <TableCell className="font-medium text-neutral-900 text-xs">{r.name}</TableCell>
                        <TableCell className="text-xs text-neutral-600">{r.bank_holder_name || "—"}</TableCell>
                        <TableCell className="text-xs text-neutral-600">{r.bank_name || "—"}</TableCell>
                        <TableCell className="font-mono text-xs text-neutral-700">
                          {r.bank_account_number ? `••••${r.bank_account_number.slice(-4)}` : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-neutral-600">{r.bank_ifsc || "—"}</TableCell>
                        <TableCell className="text-right text-xs text-neutral-900 font-mono font-medium">{r.upi_id || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
          {/* BANNERS / ADS TAB */}
          <TabsContent value="ads" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Promotional Banners & Ads</h2>
                <p className="text-xs text-neutral-500">Marketing carousel banners displayed on customer home</p>
              </div>
              <AddAdModal onAdAdded={loadAllData} />
            </div>

            <Card className="bg-white border-neutral-200 shadow-xs">
              <Table>
                <TableHeader className="border-neutral-200 bg-neutral-50">
                  <TableRow className="border-neutral-200">
                    <TableHead className="text-neutral-600 text-xs">Banner Preview</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Title</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Redirect Link</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Order</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Status</TableHead>
                    <TableHead className="text-neutral-600 text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-neutral-500 py-8 text-xs">
                        No promotional banners created yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ads.map((ad) => (
                      <TableRow key={ad.id} className="border-neutral-200 hover:bg-neutral-50">
                        <TableCell>
                          <img
                            src={ad.image_url}
                            alt={ad.title || "Banner"}
                            className="w-20 h-10 object-cover rounded border border-neutral-200"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-neutral-900 text-xs">
                          {ad.title || "Untitled Banner"}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-neutral-600">
                          {ad.redirect_link || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-neutral-700 font-mono">
                          #{ad.display_order}
                        </TableCell>
                        <TableCell>
                          <Badge className={ad.is_active ? "bg-neutral-900 text-white border border-neutral-900 text-[11px]" : "bg-neutral-100 text-neutral-500 border border-neutral-300 text-[11px]"}>
                            {ad.is_active ? "Active" : "Hidden"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800"
                            onClick={() => handleToggleAd(ad.id, ad.is_active)}
                          >
                            {ad.is_active ? "Hide" : "Show"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100"
                            onClick={() => handleDeleteAd(ad.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* MENU AUDIT LOG TAB */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Platform Menu Item Audit Log</h2>
                <p className="text-xs text-neutral-500">Track all menu changes, price/stock adjustments, and deletions</p>
              </div>
            </div>

            <Card className="bg-white border-neutral-200 shadow-xs">
              <Table>
                <TableHeader className="border-neutral-200 bg-neutral-50">
                  <TableRow className="border-neutral-200">
                    <TableHead className="text-neutral-600 text-xs">Timestamp</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Restaurant</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Item</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Action</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Source</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Actor</TableHead>
                    <TableHead className="text-neutral-600 text-xs">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-neutral-500 py-8 text-xs">
                        No menu history records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history
                      .slice((pageHistory - 1) * pageSize, pageHistory * pageSize)
                      .map((h) => (
                      <TableRow key={h.id} className="border-neutral-200 hover:bg-neutral-50">
                        <TableCell className="text-xs text-neutral-500 font-mono">
                          {new Date(h.created_at).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-neutral-900">
                          {h.restaurants?.name || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-neutral-700">
                          {h.menu_items?.name || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            h.action === "created"
                              ? "bg-neutral-900 text-white border border-neutral-900 text-[11px]"
                              : h.action === "deleted"
                              ? "bg-neutral-200 text-neutral-600 border border-neutral-300 text-[11px]"
                              : "bg-neutral-100 text-neutral-800 border border-neutral-300 text-[11px]"
                          }>
                            {h.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-neutral-600 uppercase">
                          {h.source}
                        </TableCell>
                        <TableCell className="text-xs text-neutral-700">
                          {h.changed_by_profile?.full_name || h.changed_by_profile?.email || "System"}
                        </TableCell>
                        <TableCell className="text-xs text-neutral-500 max-w-xs truncate">
                          {h.change_note || "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={pageHistory}
                totalItems={history.length}
                pageSize={pageSize}
                onPageChange={setPageHistory}
                onPageSizeChange={setPageSize}
              />
            </Card>
          </TabsContent>

          {/* REVENUE & PAYOUTS TAB */}
          <TabsContent value="revenue" className="space-y-4">
            <SellerRevenueCalculator restaurants={restaurants} orders={orders} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  </div>
  );
}
