import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Snoopy — AI website teardown",
  description: "Named AI agents read your page, argue in public, and hand you a fix queue. Run your first teardown in 90 seconds.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const publicConfig = {
    posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "",
    posthogProjectToken: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? "",
  };

  return (
    <html lang="en" className={`${inter.variable} bg-background scroll-smooth`}>
      <body className="font-sans antialiased">
        <script
          id="snoopy-public-config"
          dangerouslySetInnerHTML={{
            __html: `window.__SNOOPY_PUBLIC_CONFIG__=${JSON.stringify(publicConfig).replaceAll("<", "\\u003c")};`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
