import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, Kalam } from "next/font/google";
import "./globals.css";

const body = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

const hand = Kalam({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-hand",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "MealPrep", template: "%s · MealPrep" },
  description: "Weekly meal prep for one household.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "MealPrep", statusBarStyle: "default" },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2F5F1" },
    { media: "(prefers-color-scheme: dark)", color: "#111915" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${hand.variable}`}>
      <body>{children}</body>
    </html>
  );
}
