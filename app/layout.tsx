import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";
// import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import HeaderWrapper from "@/components/headerWrapper";
import Footer from "@/components/footer";

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

            <Footer />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
