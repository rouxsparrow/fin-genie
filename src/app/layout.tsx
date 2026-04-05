import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Fin Genie",
  description: "Household finance analyzer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        {children}
        <Toaster
          theme="light"
          position="bottom-right"
          toastOptions={{ duration: 4000 }}
        />
      </body>
    </html>
  );
}
