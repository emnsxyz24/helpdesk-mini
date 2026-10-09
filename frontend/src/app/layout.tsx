import type { Metadata } from "next";

import "./globals.css";
import Provider from "@/components/Providers";

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
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
