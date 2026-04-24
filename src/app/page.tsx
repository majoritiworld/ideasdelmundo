import { redirect } from "next/navigation";
import WEB_ROUTES from "@/constants/web-routes.constants";

export default function RootPage() {
  redirect(WEB_ROUTES.DEMO_GUIDE);
}
