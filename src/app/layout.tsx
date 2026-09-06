import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NTCAS Accounting",
  description: "Manage account groups, sub-groups and ledgers (chart of accounts)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
