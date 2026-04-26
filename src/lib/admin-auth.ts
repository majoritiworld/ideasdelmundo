import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import WEB_ROUTES from "@/constants/web-routes.constants";
import { createClient } from "@/utils/supabase/server";

function getAllowedAdminEmails() {
  return (process.env.INTERNAL_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email: string | undefined | null) {
  if (!email) return false;

  return getAllowedAdminEmails().includes(email.toLowerCase());
}

export async function getAdminUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAllowedAdminEmail(user?.email)) {
    return null;
  }

  return user;
}

export async function requireAdminUser() {
  const user = await getAdminUser();

  if (!user) {
    redirect(WEB_ROUTES.INTERNAL.LOGIN);
  }

  return user;
}
