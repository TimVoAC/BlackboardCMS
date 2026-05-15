import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusBoard",
  description: "College CMS for registration, teaching, and learning"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
