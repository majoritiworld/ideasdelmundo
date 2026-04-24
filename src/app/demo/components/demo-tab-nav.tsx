"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Iconify from "@/components/ui/iconify";
import { Typography } from "@/components/ui/typography";
import { DEMO_TABS } from "@/constants/demo-tabs.constants";
import { cn } from "@/lib/utils";

export function DemoTabNav() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <nav
      className="mb-6 flex w-full overflow-x-auto border-b [-webkit-overflow-scrolling:touch]"
      aria-label="Demo sections"
    >
      {DEMO_TABS.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent"
            )}
          >
            <Iconify icon={tab.icon} className="size-4" />
            <Typography variant="label2" as="span">
              {t(tab.labelKey)}
            </Typography>
          </Link>
        );
      })}
    </nav>
  );
}
