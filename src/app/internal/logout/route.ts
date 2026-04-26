import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import WEB_ROUTES from "@/constants/web-routes.constants";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL(WEB_ROUTES.INTERNAL.LOGIN, request.url));
}
