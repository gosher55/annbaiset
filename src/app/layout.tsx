import type { Metadata } from "next";
import { Prompt } from "next/font/google"; // Changed font
import "@/app/globals.css";
import { SessionWrapper } from "@/components/session-wrapper";

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "Annbaiset", // Changed title
  description: "ระบบจัดเก็บใบเสร็จและ OCR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        suppressHydrationWarning
        className={`${prompt.variable} font-sans antialiased bg-blue-50 relative min-h-screen`}
      >
        <SessionWrapper>
          {children}
        </SessionWrapper>
      </body>
    </html>
  );
}
