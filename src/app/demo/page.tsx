import { redirect } from "next/navigation";
import WEB_ROUTES from "@/constants/web-routes.constants";

export default function DemoPage() {
  redirect(WEB_ROUTES.DEMO_GUIDE);
}
