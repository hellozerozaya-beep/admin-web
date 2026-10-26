"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RestaurantRow, OrderRow } from "@/lib/admin-api";
import { DollarSign, TrendingUp, CheckCircle2, Clock } from "lucide-react";

interface SellerRevenueCalculatorProps {
  restaurants: RestaurantRow[];
  orders: OrderRow[];
}

type Timeframe = "daily" | "weekly" | "monthly" | "yearly" | "all";

export default function SellerRevenueCalculator({ restaurants, orders }: SellerRevenueCalculatorProps) {
  const [selectedSellerId, setSelectedSellerId] = useState<string>("all");
  const [timeframe, setTimeframe] = useState<Timeframe>("daily");
  const [searchFilter, setSearchFilter] = useState("");

  // Helper to determine if order created_at falls inside selected timeframe
  const isWithinTimeframe = (dateString: string, frame: Timeframe): boolean => {
    if (frame === "all") return true;
    const orderDate = new Date(dateString);
    const now = new Date();

    if (frame === "daily") {
      return (
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getDate() === now.getDate()
      );
    }

    if (frame === "weekly") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return orderDate >= oneWeekAgo && orderDate <= now;
    }

    if (frame === "monthly") {
      return (
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth()
      );
    }

    if (frame === "yearly") {
      return orderDate.getFullYear() === now.getFullYear();
    }

    return true;
  };

  // Helper to compute fee and net payout for an order
  const extractOrderFinancials = (order: OrderRow) => {
    const totalAmount = Number(order.total_amount) || 0;
    const breakdown = order.payment_breakdown || {};

    let platformFee = 0;
    let sellerPayable = 0;

    if (typeof breakdown.platform_fee === "number") {
      platformFee = breakdown.platform_fee;
      sellerPayable = breakdown.subtotal !== undefined ? breakdown.subtotal : Math.max(0, totalAmount - platformFee);
    } else {
      // Platform rule: subtotal < 50 => ₹3, else ₹5
      platformFee = totalAmount < 50 ? 3 : 5;
      sellerPayable = Math.max(0, totalAmount - platformFee);
    }

    return { totalAmount, platformFee, sellerPayable };
  };

  // Grouped aggregates per seller
  const sellerFinancials = useMemo(() => {
    const map = new Map<
      string,
      {
        restaurantId: string;
        name: string;
        sellerType: string;
        bankHolder: string;
        bankAccount: string;
        upi: string;
        totalOrders: number;
        completedOrders: number;
        pendingOrders: number;
        grossIncoming: number;
        platformFeeDeducted: number;
        netPayable: number;
        payableCompletedOnly: number;
      }
    >();

    // Initialize all restaurants
    restaurants.forEach((r) => {
      map.set(r.id, {
        restaurantId: r.id,
        name: r.name,
        sellerType: r.seller_type || "restaurant",
        bankHolder: r.bank_holder_name || "—",
        bankAccount: r.bank_account_number || "",
        upi: r.upi_id || "",
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        grossIncoming: 0,
        platformFeeDeducted: 0,
        netPayable: 0,
        payableCompletedOnly: 0,
      });
    });

    // Accumulate orders matching timeframe
    orders.forEach((o) => {
      if (!isWithinTimeframe(o.created_at, timeframe)) return;
      if (o.status === "cancelled") return;

      const restId = o.restaurant_id || "";
      let entry = map.get(restId);

      if (!entry) {
        entry = {
          restaurantId: restId,
          name: o.restaurants?.name || "Direct / Unknown",
          sellerType: "restaurant",
          bankHolder: "—",
          bankAccount: "",
          upi: "",
          totalOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          grossIncoming: 0,
          platformFeeDeducted: 0,
          netPayable: 0,
          payableCompletedOnly: 0,
        };
        map.set(restId, entry);
      }

      const { totalAmount, platformFee, sellerPayable } = extractOrderFinancials(o);

      entry.totalOrders += 1;
      entry.grossIncoming += totalAmount;
      entry.platformFeeDeducted += platformFee;
      entry.netPayable += sellerPayable;

      if (o.status === "completed") {
        entry.completedOrders += 1;
        entry.payableCompletedOnly += sellerPayable;
      } else {
        entry.pendingOrders += 1;
      }
    });

    return Array.from(map.values());
  }, [restaurants, orders, timeframe]);

  // Overall platform aggregate for selected timeframe
  const platformSummary = useMemo(() => {
    let gross = 0;
    let fee = 0;
    let net = 0;
    let completedPayout = 0;
    let orderCount = 0;

    sellerFinancials.forEach((s) => {
      gross += s.grossIncoming;
      fee += s.platformFeeDeducted;
      net += s.netPayable;
      completedPayout += s.payableCompletedOnly;
      orderCount += s.totalOrders;
    });

    return { gross, fee, net, completedPayout, orderCount };
  }, [sellerFinancials]);

  // Filtered rows for UI
  const displayRows = useMemo(() => {
    return sellerFinancials.filter((s) => {
      const matchSeller = selectedSellerId === "all" || s.restaurantId === selectedSellerId;
      const matchSearch = !searchFilter || s.name.toLowerCase().includes(searchFilter.toLowerCase());
      return matchSeller && matchSearch;
    });
  }, [sellerFinancials, selectedSellerId, searchFilter]);

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Timeframe & Filter Selector */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-neutral-900 shrink-0" /> Seller Revenue & Settlement Calculator
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Deducts platform commission (<span className="font-semibold text-neutral-900">₹3</span> if &lt;₹50, <span className="font-semibold text-neutral-900">₹5</span> if ≥₹50) to calculate exact vendor payout
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {/* Timeframe Switcher */}
          <div className="flex max-w-full overflow-x-auto bg-neutral-100 p-1 rounded-lg border border-neutral-200 shrink-0">
            {(["daily", "weekly", "monthly", "yearly", "all"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs rounded-md font-medium capitalize transition-all whitespace-nowrap ${
                  timeframe === tf
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Seller Filter */}
          <div className="w-full sm:w-48">
            <Select value={selectedSellerId} onValueChange={(val) => setSelectedSellerId(val || "all")}>
              <SelectTrigger className="w-full sm:w-48 bg-white border-neutral-300 text-xs text-neutral-900">
                <SelectValue placeholder="All Sellers" />
              </SelectTrigger>
              <SelectContent className="bg-white border-neutral-200 text-neutral-900 text-xs max-h-56">
                <SelectItem value="all">All Outlets / Sellers</SelectItem>
                {restaurants.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Text search */}
          <Input
            placeholder="Search seller..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full sm:w-40 bg-white border-neutral-300 text-xs text-neutral-900"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-neutral-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-neutral-500 font-semibold tracking-wider flex items-center justify-between">
              Gross Volume ({timeframe})
              <TrendingUp className="w-4 h-4 text-neutral-900" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-neutral-900">₹{platformSummary.gross.toLocaleString("en-IN")}</div>
            <p className="text-xs text-neutral-500 mt-1">{platformSummary.orderCount} orders in period</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-neutral-500 font-semibold tracking-wider flex items-center justify-between">
              Platform Fee Deducted
              <span className="text-neutral-900 font-mono text-xs font-bold">Revenue</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-neutral-900">₹{platformSummary.fee.toLocaleString("en-IN")}</div>
            <p className="text-xs text-neutral-500 mt-1">Platform retained share</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-neutral-500 font-semibold tracking-wider flex items-center justify-between">
              Ready Payout (Completed)
              <CheckCircle2 className="w-4 h-4 text-neutral-900" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-neutral-900">₹{platformSummary.completedPayout.toLocaleString("en-IN")}</div>
            <p className="text-xs text-neutral-600 mt-1 font-medium">Fulfilled order settlements</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-neutral-500 font-semibold tracking-wider flex items-center justify-between">
              Total Net Payable
              <Clock className="w-4 h-4 text-neutral-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-neutral-900">₹{platformSummary.net.toLocaleString("en-IN")}</div>
            <p className="text-xs text-neutral-500 mt-1">Includes in-transit orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Table */}
      <Card className="bg-white border-neutral-200 shadow-xs">
        <CardHeader className="border-b border-neutral-200 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-neutral-900">
                Seller Breakdown — <span className="capitalize">{timeframe}</span> Calculation
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Gross incoming, platform fee cut, and net payable amount per merchant
              </CardDescription>
            </div>
            <Badge className="bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs">
              {displayRows.length} Outlets
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="border-neutral-200 bg-neutral-50">
              <TableRow className="border-neutral-200">
                <TableHead className="text-neutral-600 text-xs">Seller / Outlet</TableHead>
                <TableHead className="text-neutral-600 text-xs">Orders (Done / Pend)</TableHead>
                <TableHead className="text-neutral-600 text-xs">Gross Incoming</TableHead>
                <TableHead className="text-neutral-600 text-xs">Platform Cut (-)</TableHead>
                <TableHead className="text-neutral-600 text-xs font-bold text-neutral-900">Net Payable</TableHead>
                <TableHead className="text-neutral-600 text-xs">Settlement UPI / A/C</TableHead>
                <TableHead className="text-neutral-600 text-xs text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-neutral-500 py-8 text-xs">
                    No orders recorded for this seller during {timeframe} window.
                  </TableCell>
                </TableRow>
              ) : (
                displayRows.map((seller) => (
                  <TableRow key={seller.restaurantId} className="border-neutral-200 hover:bg-neutral-50">
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-neutral-900 text-xs">{seller.name}</div>
                        <div className="text-[11px] text-neutral-500 capitalize">{seller.sellerType}</div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <span className="text-neutral-900 font-bold">{seller.completedOrders}</span>
                      <span className="text-neutral-400"> / </span>
                      <span className="text-neutral-600 font-medium">{seller.pendingOrders}</span>
                      <span className="text-[10px] text-neutral-400 block">({seller.totalOrders} total)</span>
                    </TableCell>

                    <TableCell className="font-semibold text-xs text-neutral-800">
                      ₹{seller.grossIncoming.toLocaleString("en-IN")}
                    </TableCell>

                    <TableCell className="text-xs text-neutral-600 font-mono">
                      -₹{seller.platformFeeDeducted.toLocaleString("en-IN")}
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="font-bold text-neutral-900">
                        ₹{seller.netPayable.toLocaleString("en-IN")}
                      </div>
                      {seller.payableCompletedOnly > 0 && seller.payableCompletedOnly !== seller.netPayable && (
                        <div className="text-[10px] text-neutral-500">
                          ₹{seller.payableCompletedOnly.toLocaleString("en-IN")} verified
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-xs">
                      {seller.upi ? (
                        <span className="font-mono text-[11px] text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300">
                          {seller.upi}
                        </span>
                      ) : seller.bankAccount ? (
                        <span className="font-mono text-[11px] text-neutral-700">
                          ••••{seller.bankAccount.slice(-4)} ({seller.bankHolder})
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-400">Pending setup</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {seller.netPayable > 0 ? (
                        <Badge className="bg-neutral-900 text-white border border-neutral-900 text-[10px]">
                          Payout Due
                        </Badge>
                      ) : (
                        <Badge className="bg-neutral-100 text-neutral-500 border border-neutral-200 text-[10px]">
                          Settled
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
