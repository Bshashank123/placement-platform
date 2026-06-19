import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Placement Readiness Platform",
  description: "AI-powered resume analysis and placement readiness for colleges",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-gray-50 text-gray-900 antialiased`}>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
