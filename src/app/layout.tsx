import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { ApiProvider } from "@/providers/api-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PU-ALRMS | Prime University",
  description: "Prime University Assignment & Lab Report Management System - A comprehensive academic management platform",
  keywords: ["PU-ALRMS", "Prime University", "Assignment Management", "Lab Reports", "Academic"],
  authors: [{ name: "Jain Azmain - CSE 66 Batch" }],
  icons: {
    icon: "https://api.dicebear.com/9.x/initials/svg?seed=PU&backgroundColor=059669",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ApiProvider>
          {/*
            Loading Overlay — injected via <script> below, OUTSIDE React's tree.
            This permanently prevents hydration mismatches caused by browser
            extensions (e.g. donate-widget injectors) modifying DOM before React
            hydrates. The overlay is created imperatively and removed by page.tsx
            after hydration. Visibility is CSS-controlled via html.hydrated class.
          */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var d=document.createElement('div');d.id='pu-loading-overlay';d.setAttribute('aria-hidden','true');d.className='pu-lo';d.innerHTML='<div class="pu-lo-spinner"></div><div class="pu-lo-text">PU-ALRMS</div>';document.body.appendChild(d)}catch(e){}})();`,
            }}
          />
          {children}
          <Toaster />
          </ApiProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
