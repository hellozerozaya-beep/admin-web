"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCoupon } from "@/lib/admin-api";
import { Plus, Loader2 } from "lucide-react";

interface AddCouponModalProps {
  onCouponAdded: () => void;
}

export default function AddCouponModal({ onCouponAdded }: AddCouponModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [minOrder, setMinOrder] = useState("0");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discount || !expiresAt) {
      alert("Code, discount, and expiry date are required.");
      return;
    }

    setLoading(true);
    try {
      await createCoupon({
        code,
        description,
        discount: parseFloat(discount),
        discount_type: discountType,
        min_order: parseFloat(minOrder) || 0,
        max_discount: maxDiscount ? parseFloat(maxDiscount) : undefined,
        expires_at: new Date(expiresAt).toISOString(),
      });

      setOpen(false);
      setCode("");
      setDescription("");
      setDiscount("");
      setMaxDiscount("");
      setExpiresAt("");
      onCouponAdded();
    } catch (err: any) {
      alert("Failed to create coupon: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium gap-1 text-xs">
            <Plus className="w-3.5 h-3.5" /> Create Coupon
          </Button>
        }
      />
      <DialogContent className="bg-white border-neutral-200 text-neutral-900 max-w-md shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900">Create Promo Code</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700">Coupon Code *</label>
            <Input
              placeholder="e.g. ZERO50, SAVE20"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              className="bg-white border-neutral-300 text-xs text-neutral-900 uppercase font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">Discount Type</label>
              <Select value={discountType} onValueChange={(val: any) => setDiscountType(val)}>
                <SelectTrigger className="bg-white border-neutral-300 text-xs text-neutral-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-neutral-200 text-neutral-900 text-xs">
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">
                Discount {discountType === "percentage" ? "(%)" : "(₹)"} *
              </label>
              <Input
                type="number"
                placeholder={discountType === "percentage" ? "20" : "50"}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                required
                className="bg-white border-neutral-300 text-xs text-neutral-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">Min Order (₹)</label>
              <Input
                type="number"
                placeholder="0"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                className="bg-white border-neutral-300 text-xs text-neutral-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">Max Discount (₹)</label>
              <Input
                type="number"
                placeholder="100"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                className="bg-white border-neutral-300 text-xs text-neutral-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700">Expires On *</label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              required
              className="bg-white border-neutral-300 text-xs text-neutral-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700">Description</label>
            <Textarea
              placeholder="Terms or coupon explanation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white border-neutral-300 text-xs text-neutral-900 resize-none"
              rows={2}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs mt-3"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : "Create & Activate"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
