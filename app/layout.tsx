import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "From Car Washes to Community",
  description: "Explore illustrative community-oriented development scenarios near real NYC subway stations.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
