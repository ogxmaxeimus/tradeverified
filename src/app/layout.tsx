import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/ui";
import { getViewer } from "@/lib/session";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "TradeVerified",
    template: "%s · TradeVerified",
  },
  description: "Verified profiles, licenses, and jobs for skilled trades workers and the employers who hire them.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const viewer = await getViewer();

  return (
    <html lang="en">
      <body className={inter.className}>
        <Header viewer={viewer} />
        <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          TradeVerified pilot. Credential checks are manual. Workers can apply for free.
        </footer>
      </body>
    </html>
  );
}
