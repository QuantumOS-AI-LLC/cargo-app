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
          strategy="afterInteractive" 
        />
        <Script 
          src="https://assets.refref.ai/attribution.js" 
          strategy="afterInteractive"
        />
        <Script id="lc-visitor-tracking" strategy="afterInteractive" dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var t = document.createElement("script");
              t.type = "text/javascript", t.async = !0, t.src = 'https://link.msgsndr.com/js/am.js', t.onload = t.onreadystatechange = function() {
                  var t = this.readyState;
                  if (!t || "complete" == t || "loaded" == t) try {
                    affiliateManager.init('Rbdn8EXoRslKDRVegEhp', 'https://backend.leadconnectorhq.com', '.cargo-app-rho.vercel.app')
                  } catch (t) {}
              };
              var e = document.getElementsByTagName("script")[0];
              if (e && e.parentNode) {
                e.parentNode.insertBefore(t, e)
              } else {
                document.head.appendChild(t);
              }
          })();
          `
        }} />
      </body>
    </html>
  );
}
