import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Vazirmatn } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const vazirmatn = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CoinPulse — Real-time Crypto Dashboard",
  description:
    "Live cryptocurrency prices, candlestick charts, portfolio tracking and price alerts. Built with Next.js, TradingView lightweight-charts, CoinLore & Binance APIs.",
  keywords: ["crypto", "bitcoin", "dashboard", "portfolio", "price alerts", "trading"],
};

export const viewport: Viewport = {
  themeColor: "#060809",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="dark" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${vazirmatn.variable} antialiased bg-[#060809] text-zinc-100`}
      >
        {children}
      </body>
    </html>
  );
}
