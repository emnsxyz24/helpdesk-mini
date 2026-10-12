import type { Metadata } from "next";

import "./globals.css";
import Provider from "@/components/Providers";
import { Outfit, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const fontSans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});


export const metadata: Metadata = {
  title: "SVO Helpdesk",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={cn( fontSans.variable, fontMono.variable, "antialiased" )} >
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
