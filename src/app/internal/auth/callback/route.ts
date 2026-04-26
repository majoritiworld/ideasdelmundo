import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import WEB_ROUTES from "@/constants/web-routes.constants";
import { isAllowedAdminEmail } from "@/lib/admin-auth";
import { createClient } from "@/utils/supabase/server";

function getSafeNextPath(value: string | null) {
  if (!value?.startsWith("/internal/")) {
    return WEB_ROUTES.INTERNAL.SESSIONS;
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL(WEB_ROUTES.INTERNAL.LOGIN, request.url));
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(WEB_ROUTES.INTERNAL.LOGIN, request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAllowedAdminEmail(user?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL(WEB_ROUTES.INTERNAL.LOGIN, request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
