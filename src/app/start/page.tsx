import { redirect } from "next/navigation";

// Public, non-gated entry into the experience. Hand this link out directly.
// It drops visitors past the invite gate into the name-capture start screen.
export default function StartPage() {
  redirect("/?start=1");
}
