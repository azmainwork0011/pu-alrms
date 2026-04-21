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
          defaultTheme="light"
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
              __html: `(function(){try{var d=document.createElement('div');d.id='pu-loading-overlay';d.setAttribute('aria-hidden','true');d.className='pu-lo';d.innerHTML='<div class="pu-lo-bg"></div><div class="pu-lo-particles"><span class="pu-lo-dot"></span><span class="pu-lo-dot"></span><span class="pu-lo-dot"></span><span class="pu-lo-dot"></span><span class="pu-lo-dot"></span><span class="pu-lo-dot"></span></div><div class="pu-lo-content"><div class="pu-lo-logo"><div class="pu-lo-ring pu-lo-ring-1"></div><div class="pu-lo-ring pu-lo-ring-2"></div><div class="pu-lo-ring pu-lo-ring-3"></div><svg class="pu-lo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"/></svg></div><div class="pu-lo-title-wrap"><h1 class="pu-lo-title">PU-ALRMS</h1><div class="pu-lo-title-line"></div></div><p class="pu-lo-tagline">Loading your experience<span class="pu-lo-dots"><span>.</span><span>.</span><span>.</span></span></p><div class="pu-lo-bar-track"><div class="pu-lo-bar-fill"></div></div><div class="pu-lo-steps"><span class="pu-lo-step">Auth</span><span class="pu-lo-step">Data</span><span class="pu-lo-step">Ready</span></div><div class="pu-lo-msgs"><span class="pu-lo-msg">Preparing your workspace...</span><span class="pu-lo-msg">Loading resources...</span><span class="pu-lo-msg">Setting things up...</span><span class="pu-lo-msg">Almost ready...</span></div><div class="pu-lo-welcome"><span class="pu-lo-welcome-wave">&#x1F44B;</span><span class="pu-lo-welcome-text">Welcome back, Student</span><span class="pu-lo-welcome-sub">Your academic hub is ready</span></div><p class="pu-lo-footer">Prime University &mdash; Academic Learning Resource Management System</p></div>';document.body.appendChild(d)}catch(e){}})();`,
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
