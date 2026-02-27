import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '../lib/auth-context';

export const metadata: Metadata = {
  title: "SES案件マッチング管理 | ReForce",
  description: "ReForce株式会社 SES営業部向けの案件・人材マッチング管理Webアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
