import WEB_ROUTES from "./web-routes.constants";

export type DemoTab = {
  id: string;
  labelKey: string;
  icon: string;
  href: string;
};

export const DEMO_TABS: DemoTab[] = [
  { id: "guide", labelKey: "tabGuide", icon: "lucide:compass", href: WEB_ROUTES.DEMO_GUIDE },
  {
    id: "ai-tips",
    labelKey: "tabTokenUsage",
    icon: "lucide:coins",
    href: WEB_ROUTES.DEMO_AI_TIPS,
  },
  {
    id: "view",
    labelKey: "tabView",
    icon: "lucide:eye",
    href: WEB_ROUTES.DEMO_VIEW,
  },
  {
    id: "dashboard",
    labelKey: "tabDashboard",
    icon: "lucide:layout-dashboard",
    href: WEB_ROUTES.DEMO_DASHBOARD,
  },
  { id: "forms", labelKey: "tabForms", icon: "lucide:file-text", href: WEB_ROUTES.DEMO_FORMS },
  {
    id: "dialogs",
    labelKey: "tabDialogs",
    icon: "lucide:message-square",
    href: WEB_ROUTES.DEMO_DIALOGS,
  },
  {
    id: "technical-guide",
    labelKey: "tabTechnicalGuide",
    icon: "lucide:book-open",
    href: WEB_ROUTES.DEMO_TECHNICAL_GUIDE,
  },
];
