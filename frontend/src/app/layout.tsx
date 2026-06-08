import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  subsets: ["arabic"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: "نظام إدارة العيادة | عيادة نُخبة الطبي",
  description: "نظام متكامل لإدارة العيادات والمراكز الطبية",
};

import Providers from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlexSansArabic.variable} h-full antialiased`}
    >
      <body className={`${ibmPlexSansArabic.className} min-h-full flex flex-col`}>
        <Providers>
          {children}
        </Providers>
        <style>{`
          @media print {
            .no-print, button, nav, aside, .header-actions {
              display: none !important;
            }
            body {
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .print-container {
              width: 100% !important;
              padding: 20px !important;
            }
            main {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
