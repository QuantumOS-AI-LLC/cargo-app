import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CargoDeductible — We cover your cargo deductible",
  description: "No out-of-pocket costs on catastrophic claims. Just a small admin fee — so you ship with confidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
