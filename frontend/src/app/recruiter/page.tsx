import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RecruiterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-lg px-4">
        <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
        <p className="text-muted-foreground">
          Analyze company sentiment, explore why employees leave, and compare competitors.
        </p>
        <p className="text-sm text-muted-foreground italic">
          Full dashboard coming in Story 7.
        </p>
        <Link href="/">
          <Button variant="outline" className="mt-4">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
