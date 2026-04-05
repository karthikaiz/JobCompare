"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";

const LIVE_PREVIEW = [
  { name: "Razorpay", rating: "3.4", industry: "Fintech" },
  { name: "Zomato", rating: "3.9", industry: "Food & Delivery" },
  { name: "Zoho", rating: "4.0", industry: "SaaS" },
];

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function RegisterContent() {
  const { register, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("from") || "/job-seeker";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    const result = await register(email, password, displayName || undefined);
    setLoading(false);
    if (result.error) setError(result.error);
    else router.push(redirectTo);
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    const result = await loginWithGoogle();
    setGoogleLoading(false);
    if (result.error) setError(result.error);
    else router.push(redirectTo);
  };

  return (
    <div className="min-h-screen flex bg-cream">
      {/* LEFT — brand panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 flex-col border-r-2 border-ink/15 bg-cream"
      >
        <div className="p-8">
          <Link href="/" className="font-serif font-bold text-ink text-lg tracking-tight">
            Job<span className="text-terracotta">Compare</span>
          </Link>
        </div>
        <div className="flex-1 flex flex-col justify-center px-12">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-5 h-px bg-terracotta" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-terracotta font-sans font-medium">Join the Platform</span>
          </div>
          <h2 className="font-serif font-bold text-ink text-3xl leading-tight mb-8">
            Your next career move<br />starts with data.
          </h2>
          {/* Live data mini panel */}
          <div className="border border-ink/15 bg-white overflow-hidden">
            <div className="px-4 py-2.5 border-b border-ink/10 bg-cream flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-terracotta/30" />
                  <span className="w-2 h-2 rounded-full bg-terracotta/20" />
                  <span className="w-2 h-2 rounded-full bg-terracotta/10" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">Live Data</span>
              </div>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans">Live</span>
              </span>
            </div>
            <div className="divide-y divide-ink/8">
              {LIVE_PREVIEW.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.35 }}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="text-ink/70 font-sans text-sm">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-warmgray text-xs font-sans">{c.industry}</span>
                    <span className="text-terracotta font-mono text-sm font-bold">{c.rating}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-8">
          <span className="text-[10px] uppercase tracking-[0.14em] text-warmgray font-sans">India&apos;s #1 Company Comparison Platform</span>
        </div>
      </motion.div>

      {/* RIGHT — form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        className="flex-1 lg:w-1/2 flex items-center justify-center px-6 bg-cream"
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="font-serif font-bold text-ink text-lg tracking-tight">
              Job<span className="text-terracotta">Compare</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="font-serif font-bold text-ink text-2xl mb-1">Create account</h1>
            <p className="text-warmgray text-sm font-sans">Sign up to start comparing companies</p>
          </div>

          {error && (
            <div className="bg-[#B05252]/10 text-[#B05252] text-sm px-3 py-2 border border-[#B05252]/25 mb-4 font-sans">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full h-11 flex items-center justify-center gap-2.5 border border-ink/20 text-ink text-sm font-sans hover:border-ink/40 hover:bg-ink/3 transition-colors disabled:opacity-50 mb-4"
          >
            <GoogleIcon />
            {googleLoading ? "Signing up..." : "Continue with Google"}
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ink/15" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-cream px-3 text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans">Display Name (optional)</label>
              <input
                placeholder="How you want to appear"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-11 px-3 text-sm text-ink placeholder:text-warmgray/50 bg-white border border-ink/20 outline-none focus:border-terracotta transition-colors font-sans"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 px-3 text-sm text-ink placeholder:text-warmgray/50 bg-white border border-ink/20 outline-none focus:border-terracotta transition-colors font-sans"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans">Password</label>
              <input
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full h-11 px-3 text-sm text-ink placeholder:text-warmgray/50 bg-white border border-ink/20 outline-none focus:border-terracotta transition-colors font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-11 bg-ink text-cream text-xs uppercase tracking-[0.1em] font-medium font-sans hover:bg-ink/85 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs text-warmgray mt-6 font-sans">
            Already have an account?{" "}
            <Link href="/login" className="text-terracotta hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <RegisterContent />
    </Suspense>
  );
}
