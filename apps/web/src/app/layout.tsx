import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snoopy",
  description: "Persona-led browser audits for marketing and commerce flows.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const publicConfig = {
    posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "",
    posthogProjectToken: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? "",
  };

  return (
    <html lang="en">
      <body>
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
