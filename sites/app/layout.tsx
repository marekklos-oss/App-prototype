import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Direct — klikací prototyp mobilní appky",
  description: "Klikací prototyp mobilní aplikace Direct.",
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
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
