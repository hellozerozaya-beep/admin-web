"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMenuItem, RestaurantRow } from "@/lib/admin-api";
import { Plus, Loader2, Upload } from "lucide-react";

interface AddItemModalProps {
  restaurants: RestaurantRow[];
  onItemAdded: () => void;
}

export default function AddItemModal({ restaurants, onItemAdded }: AddItemModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restaurantId, setRestaurantId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [category, setCategory] = useState("Main Course");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isVeg, setIsVeg] = useState(true);
  const [isSurpriseBag, setIsSurpriseBag] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", isSurpriseBag ? "zerozaya_surprise_bags" : "zerozaya_menu_items");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.secure_url) {
        throw new Error(data.error || "Upload failed");
      }

      setImageUrl(data.secure_url);
    } catch (err: any) {
      alert("Image upload failed: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId || !name || !price) {
      alert("Restaurant, item name, and price are required.");
      return;
    }

    setLoading(true);
    try {
      await createMenuItem({
        restaurant_id: restaurantId,
        name,
        description,
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : parseFloat(price),
        quantity: parseInt(quantity) || 10,
        category,
        image_url: imageUrl || undefined,
        is_veg: isVeg,
        is_surprise_bag: isSurpriseBag,
        is_available: true,
      });

      setOpen(false);
      setName("");
      setDescription("");
      setPrice("");
      setOriginalPrice("");
      setImageUrl("");
      onItemAdded();
    } catch (err: any) {
      alert("Failed to add item: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium gap-1 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Menu Item / Bag
          </Button>
        }
      />
      <DialogContent className="bg-white border-neutral-200 text-neutral-900 max-w-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900">Add New Item to Database</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Outlet select */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700">Target Restaurant Outlet *</label>
            <Select value={restaurantId} onValueChange={(val) => setRestaurantId(val || "")}>
              <SelectTrigger className="bg-white border-neutral-300 text-neutral-900 text-xs">
                <SelectValue placeholder="Select a restaurant" />
              </SelectTrigger>
              <SelectContent className="bg-white border-neutral-200 text-neutral-900 text-xs max-h-48">
                {restaurants.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">Item Name *</label>
              <Input
                placeholder="e.g. Paneer Butter Masala"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white border-neutral-300 text-xs text-neutral-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">Category</label>
              <Input
                placeholder="Main Course, Snacks, Bakery"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-white border-neutral-300 text-xs text-neutral-900"
              />
            </div>
          </div>

          {/* Price, Original Price, Quantity */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">Sale Price (₹) *</label>
              <Input
                type="number"
                placeholder="99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="bg-white border-neutral-300 text-xs text-neutral-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">Original Price (₹)</label>
              <Input
                type="number"
                placeholder="199"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="bg-white border-neutral-300 text-xs text-neutral-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">Stock Qty</label>
              <Input
                type="number"
                placeholder="10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-white border-neutral-300 text-xs text-neutral-900"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700">Description</label>
            <Textarea
              placeholder="Freshly prepared hot item or mystery surplus rescue bag..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white border-neutral-300 text-xs text-neutral-900 resize-none"
              rows={2}
            />
          </div>

          {/* Image Upload & URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700">Item Image (Upload via Cloudinary or URL)</label>
            <div className="flex gap-2 items-center">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploadingImage}
                className="bg-white border-neutral-300 text-xs text-neutral-900 file:bg-neutral-100 file:text-neutral-800 file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 file:text-xs hover:file:bg-neutral-200"
              />
              {uploadingImage && <Loader2 className="w-4 h-4 animate-spin text-neutral-900 shrink-0" />}
            </div>
            <Input
              placeholder="Or paste direct image URL (https://...)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="bg-white border-neutral-300 text-xs text-neutral-900 mt-1"
            />
            {imageUrl && (
              <div className="mt-1 flex items-center gap-2">
                <img src={imageUrl} alt="Preview" className="w-8 h-8 rounded object-cover border border-neutral-200" />
                <span className="text-[10px] text-neutral-600 truncate max-w-xs">{imageUrl}</span>
              </div>
            )}
          </div>

          {/* Flags */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
            <div className="flex items-center gap-2">
              <Switch checked={isVeg} onCheckedChange={setIsVeg} id="veg-switch" />
              <label htmlFor="veg-switch" className="text-xs text-neutral-700 cursor-pointer">
                Vegetarian
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isSurpriseBag} onCheckedChange={setIsSurpriseBag} id="bag-switch" />
              <label htmlFor="bag-switch" className="text-xs text-neutral-900 font-semibold cursor-pointer">
                Is Surprise / Rescue Bag
              </label>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs mt-3"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : "Save to Database"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
