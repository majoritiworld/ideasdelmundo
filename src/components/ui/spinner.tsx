import Iconify from "@/components/ui/iconify";

import { cn } from "@/lib/utils";

function Spinner({ className }: React.ComponentProps<"svg">) {
  return (
    <Iconify
      icon="lucide:loader-2"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
    />
  );
}

export { Spinner };
