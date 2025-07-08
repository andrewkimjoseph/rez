import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-sen)]">

      <main className="flex flex-col gap-[32px] sm:items-start pt-8">

        <Button size="sm" disabled>
          <Loader2Icon className="animate-spin" />
          Rez, coming soon
        </Button>

      </main>
    </div>
  );
}
