import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "TARA — A little closer to the cosmos",
  description:
    "Explore the planets, their real orbital periods, and the science behind our expanding universe.",
  applicationName: "TARA",
  keywords: [
    "astronomy",
    "astrophysics",
    "astrobiology",
    "cosmology",
    "solar system",
    "planets",
    "TARA",
  ],
  openGraph: {
    title: "TARA — A little closer to the cosmos",
    description:
      "An interactive field guide to the planets, the sciences of the sky, and the story of the universe.",
    siteName: "TARA",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "TARA — A little closer to the cosmos",
    description:
      "An interactive field guide to the planets, the sciences of the sky, and the story of the universe.",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
