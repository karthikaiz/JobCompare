"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { SearchBar } from "@/components/search-bar";

interface LiveCompany { name: string; slug: string; overallRating: number | null; industry: string | null; }

const FALLBACK_COMPANIES: LiveCompany[] = [
  { name: "Infosys", slug: "infosys", overallRating: 3.5, industry: "IT Services" },
  { name: "TCS", slug: "tata-consultancy-services", overallRating: 3.7, industry: "IT Services" },
  { name: "Flipkart", slug: "flipkart", overallRating: 3.9, industry: "E-Commerce" },
  { name: "Razorpay", slug: "razorpay", overallRating: 3.4, industry: "Fintech" },
  { name: "Zomato", slug: "zomato", overallRating: 3.9, industry: "Food & Delivery" },
  { name: "HDFC Bank", slug: "hdfc-bank", overallRating: 3.6, industry: "Banking" },
];

const TICKER_ITEMS = [
  "50+ Companies", "13 Industries", "5,000+ Reviews", "Salary Insights",
  "Benefits Data", "Daily Refresh", "AI Sentiment Analysis", "India's #1 Platform",
];

/* ── Animated counter ── */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !fired.current) {
        fired.current = true;
        const start = performance.now();
        const duration = 900;
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setVal(Math.round(eased * target));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{val}{suffix}</span>;
}

/* ── Live data panel ── */
function LiveDataCard({ companies }: { companies: LiveCompany[] }) {
  const [typed, setTyped] = useState("");
  const target = "flipkart";
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setTyped(target.slice(0, ++i));
      if (i >= target.length) clearInterval(id);
    }, 90);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, rotate: 0.5 }}
      animate={{ opacity: 1, x: 0, rotate: 0 }}
      transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
      className="border-2 border-ink bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(26,21,4,0.08)]"
    >
      {/* Card header */}
      <div className="px-4 py-2.5 border-b border-ink/15 flex items-center justify-between bg-cream">
        <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">Market Data</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans">Live</span>
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-ink/8">
        {companies.map((c, i) => (
          <motion.div
            key={c.slug}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.65 + i * 0.08, duration: 0.4, ease: "easeOut" }}
          >
            <Link
              href={`/job-seeker/${c.slug}`}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-[#FDF5EE] transition-colors group relative overflow-hidden"
            >
              {/* Left hover accent bar */}
              <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-terracotta scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />
              <div className="flex items-center gap-2.5 min-w-0 pl-1">
                <span className="text-[10px] text-warmgray w-4 text-right flex-shrink-0 font-mono">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm text-ink group-hover:text-terracotta transition-colors truncate font-sans">
                  {i === 2 ? typed + (typed.length < c.name.length ? "_" : "") : c.name}
                </span>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="text-xs text-warmgray hidden sm:inline font-sans">{c.industry}</span>
                <span className="text-sm font-bold text-terracotta font-mono">{c.overallRating?.toFixed(1) ?? "—"}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Stats strip — count up */}
      <div className="border-t border-ink/15 grid grid-cols-3 divide-x divide-ink/10 bg-cream">
        {[{ val: 50, suffix: "+", lbl: "Companies" }, { val: 13, suffix: "", lbl: "Industries" }, { val: 5000, suffix: "+", lbl: "Reviews" }].map(({ val, suffix, lbl }) => (
          <div key={lbl} className="flex flex-col items-center py-3">
            <span className="font-bold font-mono text-terracotta text-lg leading-none">
              <Counter target={val} suffix={suffix} />
            </span>
            <span className="text-[10px] uppercase tracking-[0.1em] text-warmgray mt-1 font-sans">{lbl}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Left column stagger ── */
const leftContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};
const leftItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();
  const [liveCompanies, setLiveCompanies] = useState<LiveCompany[]>(FALLBACK_COMPANIES);

  useEffect(() => {
    fetch("/api/companies?limit=6&offset=0")
      .then((r) => r.json())
      .then((d) => { if (d.companies?.length) setLiveCompanies(d.companies); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-cream">

      {/* ── Top bar ── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="h-12 border-b-2 border-ink bg-cream sticky top-0 z-50 flex items-center px-6 gap-4"
      >
        <Link href="/" className="font-serif font-bold text-ink text-lg tracking-tight">
          Job<span className="text-terracotta">Compare</span>
        </Link>
        <span className="w-px h-4 bg-ink/20 mx-1 hidden sm:block" />
        <nav className="hidden sm:flex items-center gap-5">
          <Link href="/job-seeker" className="text-xs uppercase tracking-[0.1em] text-warmgray hover:text-ink transition-colors font-sans">Job Seeker</Link>
          <Link href="/recruiter" className="text-xs uppercase tracking-[0.1em] text-warmgray hover:text-ink transition-colors font-sans">Recruiter</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {!authLoading && (
            user ? (
              <button onClick={logout} className="text-xs uppercase tracking-[0.1em] text-warmgray hover:text-ink transition-colors font-sans">Logout</button>
            ) : (
              <Link href="/login" className="text-xs uppercase tracking-[0.1em] border border-ink text-ink px-3 py-1.5 hover:bg-ink hover:text-cream transition-colors font-sans">
                Sign In
              </Link>
            )
          )}
        </div>
      </motion.header>

      {/* ── Split hero ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-48px-40px)]">

        {/* LEFT — 55% */}
        <motion.div
          variants={leftContainer}
          initial="hidden"
          animate="visible"
          className="flex-1 lg:w-[55%] flex flex-col justify-center px-8 lg:px-16 xl:px-24 py-16 lg:py-0 border-b lg:border-b-0 lg:border-r-2 border-ink/15"
        >
          <div className="max-w-xl">
            {/* Kicker */}
            <motion.div variants={leftItem} className="flex items-center gap-3 mb-7">
              <span className="w-6 h-px bg-terracotta" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-terracotta font-sans font-medium">
                India&apos;s #1 Company Comparison Platform
              </span>
            </motion.div>

            {/* Headline — each line animates */}
            <div className="mb-6 overflow-hidden" style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}>
              <motion.div variants={leftItem}>
                <span className="font-serif font-bold text-ink leading-[1.08] block">Compare companies</span>
              </motion.div>
              <motion.div variants={leftItem}>
                <span className="font-serif font-bold text-terracotta italic leading-[1.08] block">before you decide.</span>
              </motion.div>
            </div>

            {/* Subtext */}
            <motion.p variants={leftItem} className="text-warmgray text-base leading-relaxed mb-8 font-sans max-w-md">
              Ratings, salaries, benefits, and employee reviews — all in one place.
              Make smarter career decisions with data, not guesswork.
            </motion.p>

            {/* Search with autocomplete */}
            <motion.div variants={leftItem} className="mb-8">
              <SearchBar
                basePath="/job-seeker"
                placeholder="Search a company — e.g. Infosys, Flipkart..."
              />
            </motion.div>

            {/* CTAs */}
            <motion.div variants={leftItem} className="flex flex-wrap gap-3">
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link href="/job-seeker" className="h-11 px-7 bg-terracotta text-white text-xs uppercase tracking-[0.1em] font-medium hover:bg-[#B0623C] transition-colors flex items-center font-sans">
                  I&apos;m a Job Seeker
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link href="/recruiter" className="h-11 px-7 border-2 border-ink text-ink text-xs uppercase tracking-[0.1em] font-medium hover:bg-ink hover:text-cream transition-colors flex items-center font-sans">
                  I&apos;m a Recruiter
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust tags */}
            <motion.div variants={leftItem} className="flex flex-wrap gap-2 mt-8">
              {["Free to use", "No sign-up required", "Updated daily"].map((tag) => (
                <span key={tag} className="text-[10px] uppercase tracking-[0.1em] text-warmgray/60 border border-ink/10 px-2.5 py-1 font-sans">
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* RIGHT — 45% */}
        <div className="lg:w-[45%] flex items-center justify-center p-8 lg:p-14 bg-cream">
          <div className="w-full max-w-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="flex items-center gap-3 mb-4"
            >
              <span className="text-[10px] uppercase tracking-[0.14em] text-warmgray font-sans">Featured Companies</span>
              <span className="flex-1 h-px bg-ink/15" />
            </motion.div>
            <LiveDataCard companies={liveCompanies} />
          </div>
        </div>
      </div>

      {/* ── Ticker bar ── */}
      <div className="h-10 bg-ink overflow-hidden flex items-center">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="text-[10px] uppercase tracking-[0.14em] text-cream/55 px-8 flex-shrink-0 font-sans">
              {item}<span className="mx-6 text-cream/20">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
