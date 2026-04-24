"use client";

import { LocaleDialog } from "@/components/app";
import { Button } from "@/components/ui/button";
import Iconify from "@/components/ui/iconify";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { GITHUB_URL } from "@/constants/app.constants";

const Actions = () => {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" onClick={() => window.open(GITHUB_URL, "_blank")}>
        <Iconify icon="ri:github-fill" className="size-6" />
      </Button>
      <ThemeToggle />
      <LocaleDialog />
    </div>
  );
};

export default Actions;
