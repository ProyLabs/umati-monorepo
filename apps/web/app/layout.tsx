import CookieConsent from "@/components/blocks/cookie-consent";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProviders } from "@/providers/app-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Umati | Bring the crowd together ",
  description: "Umati makes it easy to host and play interactive party games with friends, family, or coworkers — all in real time, right from your browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={{
        cursor: `var(--cursor-pointer)`,
      }}
    >
      <body className={`${dmSans.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        <CookieConsent
          variant="small"
        />
      </body>
    </html>
  );
}
