import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Roboto_Condensed } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import "@/frontend/themes/new/new-theme.css";
import { UI_ACCENT_COOKIE, UI_THEME_COOKIE, resolveUiAccent, resolveUiTheme } from "@/lib/ui-theme";
import { ClientLayout } from "@/app/components/layout/ClientLayout";
import { Providers } from "@/app/components/layout/Providers";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TITLE_DEFAULT,
  SITE_TITLE_TEMPLATE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_ALT,
  OG_LOCALE,
  OG_TYPE,
  TWITTER_CARD,
  TWITTER_CREATOR,
  TWITTER_SITE,
} from "@/config/seo.config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Condensed UI font of the new theme. Not preloaded: classic-theme users never render it,
// so the browser only downloads it when the new theme actually uses it.
// 500 falls back to 400 and 800 to 700.
const robotoCondensed = Roboto_Condensed({
  variable: "--font-condensed",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700"],
  preload: false,
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#050608",
};

export const metadata: Metadata = {
  // ── Titles ──────────────────────────────────────────────
  title: {
    default: SITE_TITLE_DEFAULT,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,

  // ── Canonical & alternate ──────────────────────────────
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },

  // ── Icons ──────────────────────────────────────────────
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: "/favicon.png",
  },

  // ── Open Graph ─────────────────────────────────────────
  openGraph: {
    type: OG_TYPE as "website",
    locale: OG_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE_PATH,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: OG_IMAGE_ALT,
      },
    ],
  },

  // ── Twitter ────────────────────────────────────────────
  twitter: {
    card: TWITTER_CARD,
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    site: TWITTER_SITE,
    creator: TWITTER_CREATOR,
    images: [
      {
        url: OG_IMAGE_PATH,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: OG_IMAGE_ALT,
      },
    ],
  },

  // ── Robots ─────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Application metadata ───────────────────────────────
  applicationName: SITE_NAME,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  creator: "Belsterns",
  publisher: "Belsterns",
  category: "Software",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const uiTheme = resolveUiTheme(cookieStore.get(UI_THEME_COOKIE)?.value);
  const uiAccent = resolveUiAccent(cookieStore.get(UI_ACCENT_COOKIE)?.value);

  return (
    <html lang="ru" data-theme={uiTheme} data-accent={uiAccent} suppressHydrationWarning>
      <head>
        {/* GEO: llms.txt discovery for AI/LLM crawlers */}
        <link rel="alternate" type="text/plain" title="LLM-readable site description" href="/llms.txt" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${robotoCondensed.variable} antialiased bg-background min-h-screen text-foreground relative`}
        suppressHydrationWarning
      >
        <div className="relative z-10">
          <Providers uiTheme={uiTheme} uiAccent={uiAccent}>
            <ClientLayout>
              {children}
            </ClientLayout>
          </Providers>
        </div>
      </body>
    </html>
  );
}
