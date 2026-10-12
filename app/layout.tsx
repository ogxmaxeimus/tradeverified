import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "TradeVerified | The professional network for skilled trades",
  description:
    "TradeVerified is where HVAC techs, plumbers, electricians, welders, and the shops that hire them keep licenses, portfolios, and proof-backed reviews in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem("tv-theme");var dark=s==="dark"||(!s&&matchMedia("(prefers-color-scheme: dark)").matches);if(dark)document.documentElement.setAttribute("data-theme","dark");}catch(e){}`,
          }}
        />
      </head>
      <body>
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-surface focus:px-4 focus:py-2">
          Skip to content
        </a>
        <StoreProvider>{children}</StoreProvider>
        <noscript>
          <p style={{ padding: 24 }}>TradeVerified needs JavaScript to run the marketplace, profiles, and hiring tools.</p>
        </noscript>
      </body>
    </html>
  );
}
