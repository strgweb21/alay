import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alayer - Album Cosplayer 18+",
  description: "Platform galeri eksklusif dan album foto cosplayer dewasa (18+). Temukan konten cosplay premium dari berbagai cosplayer favoritmu.",
  keywords: ["Alayer", "Album Cosplayer 18+", "Cosplay Dewasa", "Galeri Cosplayer", "Cosplay Premium", "Exclusive Cosplay"],
  authors: [{ name: "Alayer Team" }],
  icons: {
    icon: "/favicon.ico", // Sesuaikan dengan path logo Anda
  },
  openGraph: {
    title: "Alayer - Album Cosplayer 18+",
    description: "Galeri eksklusif dan album foto cosplay dewasa (18+)",
    url: "https://alayer.id", // Sesuaikan dengan domain Anda
    siteName: "Alayer",
    type: "website",
    images: [
      {
        url: "/og-image.jpg", // Gambar preview media sosial
        width: 1200,
        height: 630,
        alt: "Alayer - Album Cosplayer 18+",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alayer - Album Cosplayer 18+",
    description: "Galeri eksklusif dan album foto cosplay dewasa (18+)",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
