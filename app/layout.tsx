import type { Metadata, Viewport } from "next";
import "./globals.css";

import { SystemSettingsService } from "@/lib/services/systemSettingsService";

const DEFAULT_NAME = "إدارة الطلاب";
const DEFAULT_DESC = "نظام متكامل لإدارة الطلاب والمجموعات والاشتراكات والمدفوعات للمعلمين والمراكز التعليمية";

export async function generateMetadata(): Promise<Metadata> {
  let siteName = DEFAULT_NAME;
  let siteLogo = "";

  try {
    const settings = await SystemSettingsService.getSettings();
    if (settings) {
      if (settings.site_name) siteName = settings.site_name;
      if (settings.site_logo) siteLogo = settings.site_logo;
    }
  } catch (error) {
    console.error("Failed to fetch metadata settings:", error);
  }

  const iconList = siteLogo
    ? [
        { url: siteLogo, type: "image/png" },
        { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "48x48" },
      ]
    : [
        { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "48x48" },
      ];

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: DEFAULT_DESC,
    keywords: ["إدارة الطلاب", "نظام تعليمي", "مجموعات دراسية", "اشتراكات", "مدفوعات", "معلمين", "مراكز تعليمية"],
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    robots: {
      index: false,
      follow: false,
    },
    icons: {
      icon: iconList,
      apple: "/apple-touch-icon.png",
      shortcut: "/favicon.ico",
    },
    manifest: "/manifest.json",
    openGraph: {
      type: "website",
      locale: "ar_AR",
      title: siteName,
      description: DEFAULT_DESC,
      siteName: siteName,
      images: [{ url: "/web-app-manifest-512x512.png", width: 512, height: 512, alt: siteName }],
    },
    twitter: {
      card: "summary",
      title: siteName,
      description: DEFAULT_DESC,
      images: ["/web-app-manifest-512x512.png"],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: siteName,
    },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,

  themeColor: "#4f46e5",
};

import Script from "next/script";

function ServiceWorkerRegister() {
  return (
    <Script
      id="sw-register"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              for(let registration of registrations) {
                registration.unregister();
              }
            });
          }
        `,
      }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body suppressHydrationWarning style={{ fontFamily: "'Tajawal', sans-serif" }}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
