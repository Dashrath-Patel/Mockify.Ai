import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { DotBackground } from "@/components/ui/dot-background";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { inter, robotoMono, poppins } from "@/lib/fonts";
import { homeMetadata, homeStructuredData } from "@/lib/seo";
import { SkipToContent } from "@/lib/accessibility";
import LoadingProvider from "@/components/loading-provider";
import "./globals.css";

// Use optimized metadata from SEO utilities
export const metadata: Metadata = homeMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Enable View Transitions API */}
        <meta name="view-transition" content="same-origin" />
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS Prefetch for faster lookups */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData) }}
        />
      </head>
      <body
        className={`${inter.variable} ${robotoMono.variable} ${poppins.variable} antialiased font-sans`}
      >
        <SkipToContent />
        <ThemeProvider>
          <LoadingProvider>
            <DotBackground className="min-h-screen">
              <main id="main-content">
                {children}
              </main>
            </DotBackground>
          </LoadingProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
