import { SessionProvider } from "next-auth/react";

export default function GetCoverageLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
