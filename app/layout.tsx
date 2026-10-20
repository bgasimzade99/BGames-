import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import Link from "next/link";
import "./globals.css";
import { BrandMark } from "@/components/brand/logo";
import { AccountSlot } from "@/components/shell/account-slot";
import { PrimaryNav } from "@/components/shell/primary-nav";
import { SiteFooter } from "@/components/shell/site-footer";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const instant = false;

export const metadata: Metadata = {
  title: {
    default: "BGames",
    template: "%s · BGames",
  },
  description: "A playground for strategic minds. Chess, tic tac toe, and a personal library.",
  icons: {
    icon: [
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <header className="shell-bar">
          <div className="shell-inner">
            <Link href="/" className="brand-link">
              <BrandMark />
            </Link>
            <Suspense fallback={<span className="hint">Menu</span>}>
              <PrimaryNav />
            </Suspense>
            <Suspense fallback={<span className="hint">Account</span>}>
              <AccountSlot />
            </Suspense>
          </div>
        </header>
        <main id="content" className="page">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
