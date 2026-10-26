"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Mail, Loader2, ShieldCheck, AlertCircle } from "lucide-react";

interface LoginCardProps {
  onSuccess: () => void;
}

export default function AdminLogin({ onSuccess }: LoginCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Check profile for admin privileges
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role, is_admin")
          .eq("id", data.user.id)
          .single();

        if (profileErr) {
          await supabase.auth.signOut();
          throw new Error("Could not verify permissions. Please contact administrator.");
        }

        const isAdmin = profile?.is_admin === true || profile?.role === "admin" || profile?.role === "sub_admin";
        if (!isAdmin) {
          await supabase.auth.signOut();
          throw new Error("Access Denied: Only administrator accounts can access this portal.");
        }

        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white border-neutral-200 text-neutral-900 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-neutral-900">
            ZeroZaya Admin
          </CardTitle>
          <CardDescription className="text-neutral-500 text-sm">
            Sign in with your administrator account to access platform management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-500" /> Email Address
              </label>
              <Input
                type="email"
                placeholder="admin@zerozaya.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-neutral-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-neutral-500" /> Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-neutral-900"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Authenticating...
                </>
              ) : (
                "Sign In to Admin Portal"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
