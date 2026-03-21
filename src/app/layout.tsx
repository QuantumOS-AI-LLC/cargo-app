import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
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
      <body suppressHydrationWarning>
        {children}
        <Script 
          src="https://refferq-six.vercel.app/scripts/refferq-tracker.js" 
          data-api-url="https://refferq-six.vercel.app" 
          data-api-key={process.env.NEXT_PUBLIC_REFFERQ_API_KEY}
<<<<<<< HEAD
          strategy="beforeInteractive" 
=======
          strategy="afterInteractive" 
>>>>>>> 61da28aeafe004adfcd5da8e447d48dbf65ea0ff
        />
      </body>
    </html>
  );
}
