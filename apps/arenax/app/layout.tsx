import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/hooks/use-toast";
import { AuthProvider } from "@/context/AuthProvider";
import { ThemeProvider } from "@/context/ThemeContext";


export const metadata: Metadata = {
  title: "ArenaX — Where Minds Compete",
  description:
    "Enter live contests. Face real challenges. Answer in real-time — question on one side, your answer on the other. Only the sharpest minds win.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider> <body>{children}</body></ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </html>
  );
}
