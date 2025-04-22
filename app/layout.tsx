import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from "sonner";

const inter = Inter({ subsets: ['latin']})

export const metadata: Metadata = {
  title: "FinCrest",
  description: "Reach the peak of financial management with smart expense tracking and wealth growth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.className}`}
        >
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Toaster richColors />
          <footer className="bg-amber-200 py-12">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>Made with ❤️ by Satya Chandu</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>

  );
}
