"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import WEB_ROUTES from "@/constants/web-routes.constants";
import { createClient } from "@/utils/supabase/client";

export default function InternalLoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const origin = window.location.origin;
    const callbackUrl = new URL(WEB_ROUTES.INTERNAL.AUTH_CALLBACK, origin);
    callbackUrl.searchParams.set("next", WEB_ROUTES.INTERNAL.SESSIONS);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Check your email for the admin sign-in link.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFBFE] px-5 py-10">
      <Card className="w-full max-w-md border-[#D5DCE6] bg-white">
        <CardHeader>
          <CardTitle>Admin login</CardTitle>
          <CardDescription>
            Sign in with an approved admin email to view internal sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitLogin} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-[#0F1B2D]">
              Email
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="h-11 rounded-xl border-[#D5DCE6] bg-white"
              />
            </label>
            <Button
              type="submit"
              loading={status === "loading"}
              className="h-11 rounded-full bg-[#1B3DD4] text-white hover:bg-[#1632B0]"
            >
              Send magic link
            </Button>
          </form>
          {message && (
            <p className={`mt-4 text-sm ${status === "error" ? "text-red-600" : "text-[#5A6B82]"}`}>
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
