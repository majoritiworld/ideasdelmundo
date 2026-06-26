export type AppConfig = {
  appName: string;
  appVersion: string;
  serverUrl: string;
  webUrl: string;
  /** Absolute URL used for OG tags and image resolution. */
  siteUrl: string;
  region: string;
  supportEmail: string;
  whatsapp: {
    number: string;
  };
  isProd: boolean;
  isDev: boolean;
};

export const CONFIG: AppConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "",
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  serverUrl: process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3005",
  webUrl: process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  region: process.env.NEXT_PUBLIC_REGION || "IL",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  whatsapp: {
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "972554427797",
  },
  isProd: process.env.NODE_ENV === "production",
  isDev: process.env.NODE_ENV === "development",
};

/** Builds a wa.me deep link with a prefilled (already localized) message. */
export function buildWhatsappInviteUrl(message: string): string {
  return `https://wa.me/${CONFIG.whatsapp.number}?text=${encodeURIComponent(message)}`;
}
