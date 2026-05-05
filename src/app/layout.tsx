import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Majoriti - Purpose Blueprint Experience",
  description: "A guided purpose-discovery experience from majoriti.",
  metadataBase: new URL("https://majoriti.ai"),
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Majoriti - Purpose Blueprint Experience",
    description: "A guided purpose-discovery experience from majoriti.",
    url: "https://majoriti.ai",
    siteName: "Majoriti",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Majoriti Purpose Blueprint Experience",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Majoriti - Purpose Blueprint Experience",
    description: "A guided purpose-discovery experience from majoriti.",
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAFBFE] font-sans text-[#0F1B2D] antialiased">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
