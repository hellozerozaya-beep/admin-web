"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createAd } from "@/lib/admin-api";
import { Plus, Loader2 } from "lucide-react";

interface AddAdModalProps {
  onAdAdded: () => void;
}

export default function AddAdModal({ onAdAdded }: AddAdModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [redirectLink, setRedirectLink] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "zerozaya_ads");

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
    if (!imageUrl) {
      alert("Banner image is required.");
      return;
    }

    setLoading(true);
    try {
      await createAd({
        title: title || undefined,
        description: description || undefined,
        image_url: imageUrl,
        redirect_link: redirectLink || undefined,
        display_order: parseInt(displayOrder) || 0,
      });

      setOpen(false);
      setTitle("");
      setDescription("");
      setImageUrl("");
      setRedirectLink("");
      setDisplayOrder("0");
      onAdAdded();
    } catch (err: any) {
      alert("Failed to publish ad banner: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium gap-1 text-xs">
            <Plus className="w-3.5 h-3.5" /> New Ad / Promo Banner
          </Button>
        }
      />
      <DialogContent className="bg-white border-neutral-200 text-neutral-900 max-w-md shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900">Create Promo Banner</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700">Banner Title</label>
            <Input
              placeholder="e.g. 50% Off Surplus Late Night"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white border-neutral-300 text-xs text-neutral-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700">Banner Image * (Upload or URL)</label>
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
              placeholder="https://res.cloudinary.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
              className="bg-white border-neutral-300 text-xs text-neutral-900 mt-1"
            />
            {imageUrl && (
              <div className="mt-1">
                <img src={imageUrl} alt="Banner Preview" className="w-full h-24 rounded object-cover border border-neutral-200" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">Redirect Link</label>
              <Input
                placeholder="/restaurant/..."
                value={redirectLink}
                onChange={(e) => setRedirectLink(e.target.value)}
                className="bg-white border-neutral-300 text-xs text-neutral-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">Display Order</label>
              <Input
                type="number"
                placeholder="1"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="bg-white border-neutral-300 text-xs text-neutral-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700">Description</label>
            <Textarea
              placeholder="Optional marketing copy..."
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
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : "Publish Banner"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
