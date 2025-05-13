import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";
// import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import HeaderWrapper from "@/components/headerWrapper";

const roboto_mono = Roboto_Mono({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoHunt",
  description: "A seamless platform to search, compare, and purchase vehicles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${roboto_mono.className} flex flex-col min-h-screen transition-colors duration-500`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider>
            <HeaderWrapper />
            <main className="flex-1">{children}</main>
            <Toaster richColors />
            <footer className="bg-gray-900 text-white py-6 dark:bg-gray-800">
              <div className="w-full px-7 flex flex-col md:flex-row justify-between items-center">
                <p className="text-sm">
                  &copy; {new Date().getFullYear()} AutoHunt. All rights
                  reserved.
                </p>
                <div className="flex space-x-4 mt-2 md:mt-0">
                  <a href="/privacy-policy" className="text-sm hover:underline">
                    Privacy Policy
                  </a>
                  <a href="/terms" className="text-sm hover:underline">
                    Terms of Service
                  </a>
                  <a href="/contact" className="text-sm hover:underline">
                    Contact
                  </a>
                </div>
              </div>
            </footer>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
