import type { Metadata } from "next";
import "./globals.css";
import "@/lib/utils/source-map-suppressor";

export const metadata: Metadata = {
  title: "MazaoChain MVP",
  description: "Plateforme de prêt décentralisée pour les agriculteurs en RDC",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#22c55e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}