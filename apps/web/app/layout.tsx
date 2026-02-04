import type { Metadata } from "next";
import type React from "react";

import localFont from "next/font/local";
import { DM_Sans, Space_Grotesk } from "next/font/google";

import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { AuthProvider } from "@/context/AuthProvider";
import { ToastProvider } from "@/hooks/use-toast";


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
});


export const metadata: Metadata = {
  title: "100xContest",
  description: "Developer contests platform",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          antialiased
          ${geistSans.variable}
          ${geistMono.variable}
          ${dmSans.variable}
          ${spaceGrotesk.variable}
        `}
      >
        <ToastProvider>
          <AuthProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <main>
                {children}
              </main>
            </Suspense>
          </AuthProvider>
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
