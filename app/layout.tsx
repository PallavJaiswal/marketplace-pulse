import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AppDataProvider } from "@/lib/store";
import { NavRail } from "@/components/NavRail";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Marketplace Pulse — Sales & Revenue Intelligence",
  description:
    "Upload a sales export and get automated cleaning, anomaly detection, SKU ranking, forecasting, and an AI-written executive report.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-ink text-text-primary">
        <AppDataProvider>
          <NavRail />
          <main className="flex-1 min-w-0">{children}</main>
        </AppDataProvider>
      </body>
    </html>
  );
}
