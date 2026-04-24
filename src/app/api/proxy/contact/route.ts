// Demo handler — intercepts POST /api/proxy/contact before the catch-all proxy.
// This makes the contact feature work out of the box without an external backend.
//
// To replace with a real backend:
//   1. Delete this file.
//   2. Set NEXT_PUBLIC_SERVER_URL to your API server in .env.local.
//   3. Make sure your backend accepts POST /contact with { name, email, message }.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { ContactResponse } from "@/features/contact/types/contact.types";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(1000),
});

export async function POST(req: NextRequest): Promise<NextResponse<ContactResponse>> {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Invalid request. Please check your input." },
      { status: 400 }
    );
  }

  // Simulate processing time so the loading state is visible in the UI.
  await new Promise((resolve) => setTimeout(resolve, 700));

  return NextResponse.json({
    success: true,
    message: "Message received! We'll be in touch.",
  });
}
