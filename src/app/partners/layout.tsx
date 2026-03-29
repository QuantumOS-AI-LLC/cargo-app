import { SessionProvider } from "next-auth/react";

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
