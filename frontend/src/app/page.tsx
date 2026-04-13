"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { SearchBar } from "@/components/search-bar";
import { ThemeToggle } from "@/components/theme-toggle";

interface LiveCompany { name: string; slug: string; overallRating: number | null; industry: string | null; }

const FALLBACK_COMPANIES: LiveCompany[] = [
  { name: "Infosys", slug: "infosys", overallRating: 3.5, industry: "IT Services" },
  { name: "TCS", slug: "tata-consultancy-services", overallRating: 3.7, industry: "IT Services" },
  { name: "Flipkart", slug: "flipkart", overallRating: 3.9, industry: "E-Commerce" },
  { name: "Razorpay", slug: "razorpay", overallRating: 4.2, industry: "Fintech" },
  { name: "Zomato", slug: "zomato", overallRating: 3.9, industry: "Food & Delivery" },
  { name: "HDFC Bank", slug: "hdfc-bank", overallRating: 3.6, industry: "Banking" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Search a company",
    body: "Find Indian companies across IT, fintech, banking, FMCG, and more. Ratings, salaries, and reviews all in one place.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Compare side by side",
    body: "Add up to 3 companies to compare ratings, salary ranges, benefits, and employee sentiment — at a glance, not across 10 tabs.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Decide with confidence",
    body: "Use the Offer Calculator to adjust for cost of living, weight what matters to you, and get a data-backed recommendation — not a gut feeling.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const TESTIMONIALS = [
  {
    quote: "I had two offers — TCS and Cognizant. The salary data and culture ratings helped me see that Cognizant paid 18% more for my role. I negotiated a better package and joined with full confidence.",
    name: "Arjun S.",
    role: "Software Engineer, 2 YOE",
    company: "Compared TCS vs Cognizant",
  },
  {
    quote: "The cost of living calculator was a game-changer. My Hyderabad offer looked lower than Bangalore, but after adjusting for COL it was actually worth more. Ended up taking it.",
    name: "Priya M.",
    role: "Product Manager, 4 YOE",
    company: "Used Offer Calculator",
  },
  {
    quote: "The sentiment analysis on reviews is genuinely useful — I could see that Zomato's negative reviews clustered around 'work-life balance' while Swiggy's were about 'salary'. Made my choice obvious.",
    name: "Rohan K.",
    role: "Data Analyst, 3 YOE",
    company: "Compared Zomato vs Swiggy",
  },
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
function LiveDataCard({ companies, stats }: { companies: LiveCompany[]; stats: { companies: number; reviews: number; industries: number } }) {
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
      className="border-2 border-ink bg-card overflow-hidden shadow-[4px_4px_0px_0px_rgba(26,21,4,0.08)] dark:shadow-none"
    >
      <div className="px-4 py-2.5 border-b border-ink/15 flex items-center justify-between bg-cream">
        <span className="text-[10px] uppercase tracking-[0.14em] text-terracotta font-sans font-medium">Company Data</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.1em] text-warmgray font-sans">Live</span>
        </span>
      </div>

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
              className="flex items-center justify-between px-4 py-2.5 hover:bg-terracotta/5 transition-colors group relative overflow-hidden"
            >
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

      <div className="border-t border-ink/15 grid grid-cols-3 divide-x divide-ink/10 bg-cream">
        {[
          { val: stats.companies, suffix: "+", lbl: "Companies" },
          { val: stats.industries, suffix: "",  lbl: "Industries" },
          { val: stats.reviews,   suffix: "+", lbl: "Reviews" },
        ].map(({ val, suffix, lbl }) => (
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

/* ── Section fade-in wrapper ── */
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
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
  const [stats, setStats] = useState({ companies: 163, reviews: 65000, salaries: 3000, industries: 13 });

  useEffect(() => {
    fetch("/api/companies?limit=6&offset=0")
      .then((r) => r.json())
      .then((d) => { if (d.companies?.length) setLiveCompanies(d.companies); })
      .catch(() => {});

    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
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
          <Link href="/job-seeker/compare/offers" className="text-xs uppercase tracking-[0.1em] text-warmgray hover:text-ink transition-colors font-sans">Offer Calculator</Link>
          <Link href="/should-i-switch" className="text-xs uppercase tracking-[0.1em] text-warmgray hover:text-ink transition-colors font-sans">Should I Switch?</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
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
      <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-48px)]">

        {/* LEFT */}
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
                Data-backed career decisions
              </span>
            </motion.div>

            {/* Headline */}
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
              Ratings, salaries, benefits, and employee reviews for Indian companies —
              all in one place. Compare offers, adjust for cost of living, decide with data.
            </motion.p>

            {/* Search */}
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
                  Browse Companies
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link href="/job-seeker/compare/offers" className="h-11 px-7 border-2 border-ink text-ink text-xs uppercase tracking-[0.1em] font-medium hover:bg-ink hover:text-cream transition-colors flex items-center font-sans">
                  ₹ Compare Offers
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust tags */}
            <motion.div variants={leftItem} className="flex flex-wrap gap-2 mt-8">
              {["Free to use", "No sign-up required", "Updated weekly"].map((tag) => (
                <span key={tag} className="text-[10px] uppercase tracking-[0.1em] text-warmgray/60 border border-ink/10 px-2.5 py-1 font-sans">
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* RIGHT */}
        <div className="lg:w-[45%] flex items-center justify-center p-8 lg:p-14 bg-cream">
          <div className="w-full max-w-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="flex items-center gap-3 mb-4"
            >
              <span className="text-[10px] uppercase tracking-[0.14em] text-warmgray font-sans">Top companies</span>
              <span className="flex-1 h-px bg-ink/15" />
            </motion.div>
            <LiveDataCard companies={liveCompanies} stats={stats} />
          </div>
        </div>
      </div>

      {/* ── Social proof strip ── */}
      <div className="border-y-2 border-ink/12 bg-cream">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-ink/10">
          {[
            { val: stats.companies, suffix: "+", lbl: "Companies tracked" },
            { val: stats.reviews,   suffix: "+", lbl: "Employee reviews" },
            { val: stats.salaries,  suffix: "+", lbl: "Salary data points" },
            { val: stats.industries, suffix: "",  lbl: "Industries covered" },
          ].map(({ val, suffix, lbl }) => (
            <div key={lbl} className="flex flex-col items-center py-6 px-4">
              <span className="font-serif font-bold text-terracotta text-3xl leading-none">
                <Counter target={val} suffix={suffix} />
              </span>
              <span className="text-[10px] uppercase tracking-[0.12em] text-warmgray/60 mt-2 font-sans text-center">{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="py-20 px-8 border-b-2 border-ink/10">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-3 mb-10">
              <span className="w-6 h-px bg-terracotta" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-terracotta font-sans font-medium">How it works</span>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x-2 divide-ink/10">
            {HOW_IT_WORKS.map(({ step, title, body, icon }, i) => (
              <FadeIn key={step} delay={i * 0.12}>
                <div className="md:px-10 py-6 md:py-0 first:pl-0 last:pr-0 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-terracotta font-bold tracking-widest">{step}</span>
                    <span className="flex-1 h-px bg-terracotta/20" />
                    <span className="text-terracotta">{icon}</span>
                  </div>
                  <h3 className="font-serif font-bold text-ink text-xl leading-tight">{title}</h3>
                  <p className="text-warmgray text-sm font-sans leading-relaxed">{body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* ── Testimonials ── */}
      <div className="py-20 px-8 bg-secondary border-b-2 border-ink/10">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-3 mb-10">
              <span className="w-6 h-px bg-terracotta" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-terracotta font-sans font-medium">What people say</span>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ quote, name, role, company }, i) => (
              <FadeIn key={name} delay={i * 0.1}>
                <div className="bg-card border border-ink/15 p-6 flex flex-col gap-4 h-full">
                  {/* Quote mark */}
                  <span className="font-serif text-4xl text-terracotta/30 leading-none select-none">&ldquo;</span>
                  <p className="text-sm text-ink font-sans leading-relaxed flex-1">{quote}</p>
                  <div className="pt-4 border-t border-ink/8">
                    <p className="text-sm font-serif font-bold text-ink">{name}</p>
                    <p className="text-[11px] text-warmgray font-sans mt-0.5">{role}</p>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-terracotta font-sans mt-1.5">{company}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="py-20 px-8 bg-ink">
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <h2 className="font-serif font-bold text-cream text-3xl sm:text-4xl leading-tight mb-4">
              Make your next career move<br />
              <span className="text-terracotta italic">with confidence.</span>
            </h2>
            <p className="text-cream/50 text-sm font-sans mb-8 max-w-md mx-auto leading-relaxed">
              Browse companies, compare up to 3 side by side, and run the numbers on any two offers — all free, no account required.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/job-seeker"
                className="h-11 px-8 bg-terracotta text-white text-xs uppercase tracking-[0.1em] font-medium hover:bg-[#B0623C] transition-colors inline-flex items-center font-sans"
              >
                Start Comparing
              </Link>
              <Link
                href="/job-seeker/compare/offers"
                className="h-11 px-8 border border-cream/30 text-cream text-xs uppercase tracking-[0.1em] font-medium hover:border-cream hover:text-cream transition-colors inline-flex items-center font-sans"
              >
                ₹ Offer Calculator
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="h-10 bg-ink border-t border-cream/10 flex items-center justify-between px-8">
        <span className="text-[10px] uppercase tracking-[0.14em] text-cream/25 font-sans">
          Job<span className="text-terracotta/60">Compare</span> — India
        </span>
        <div className="flex items-center gap-6">
          {["Job Seeker", "Recruiter", "Offer Calculator"].map((item, i) => {
            const hrefs = ["/job-seeker", "/recruiter", "/job-seeker/compare/offers"];
            return (
              <Link key={item} href={hrefs[i]} className="text-[10px] uppercase tracking-[0.12em] text-cream/25 hover:text-cream/50 transition-colors font-sans hidden sm:inline">
                {item}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
