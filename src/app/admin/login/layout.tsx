import { SessionProvider } from "next-auth/react";

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
