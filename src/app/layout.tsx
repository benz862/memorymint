import type { Metadata } from "next";
import { Inter, Playfair_Display, Dancing_Script } from "next/font/google";
import "./globals.css";
import GlobalNav from "@/components/GlobalNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const dancing = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-handwritten",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MemoryMint",
  description: "Turn your memories into a card worth keeping.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${dancing.variable}`}
    >
      <body>
        <GlobalNav />
        {children}
      </body>
    </html>
  );
}
