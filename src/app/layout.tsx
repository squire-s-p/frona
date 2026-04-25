// src/app/layout.tsx
import type { Metadata } from "next";
import { Nunito_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Frona",
    default: "Frona — Next-gen Business OS",
  },
  description: "Організуйте свої проекти, фінанси та час в одному професійному просторі.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body
        className={`${nunitoSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          {/* ✅ глобальні toast-повідомлення (login / register / інші) */}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
