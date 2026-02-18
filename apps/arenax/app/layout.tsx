import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
