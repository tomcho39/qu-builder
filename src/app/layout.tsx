import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "qu-builder",
    template: "%s · qu-builder",
  },
  description: "고객사가 직접 만드는 인터랙티브 테스트 플랫폼",
  openGraph: {
    title: "qu-builder",
    description: "고객사가 직접 만드는 인터랙티브 테스트 플랫폼",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        {children}
      </body>
    </html>
  );
}
