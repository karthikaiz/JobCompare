import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function JobSeekerPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-lg px-4">
        <h1 className="text-3xl font-bold">Job Seeker Dashboard</h1>
        <p className="text-muted-foreground">
          Search companies, compare salaries, read reviews, and explore benefits.
        </p>
        <p className="text-sm text-muted-foreground italic">
          Full dashboard coming in Story 5.
        </p>
        <Link href="/">
          <Button variant="outline" className="mt-4">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
