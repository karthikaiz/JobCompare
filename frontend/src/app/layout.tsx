import type { Metadata } from "next";
import localFont from "next/font/local";
import { Playfair_Display } from "next/font/google";

import "./globals.css";
import { CompareProvider } from "@/context/compare-context";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/context/theme-context";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});


export const metadata: Metadata = {
  title: "JobCompare - Compare Companies, Salaries & Reviews",
  description: "Compare companies across ratings, salaries, benefits, and employee reviews. Built for job seekers and recruiters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} ${playfair.variable}`}>
      <body className={`${geistSans.variable} min-h-screen bg-cream font-sans antialiased transition-colors duration-300`}>
        <ThemeProvider>
          <AuthProvider>
            <CompareProvider>
              {children}
            </CompareProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
