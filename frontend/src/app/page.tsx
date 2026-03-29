import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-2xl px-4">
        <h1 className="text-5xl font-bold tracking-tight">
          Job<span className="text-blue-600">Compare</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Compare companies, salaries, benefits, and reviews from multiple sources.
          Make informed career decisions.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/job-seeker">
            <Button size="lg" className="text-lg px-8 py-6">
              I&apos;m a Job Seeker
            </Button>
          </Link>
          <Link href="/recruiter">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              I&apos;m a Recruiter
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
