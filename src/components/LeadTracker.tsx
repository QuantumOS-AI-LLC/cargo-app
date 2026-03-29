"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function LeadTracker() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      if (typeof window !== "undefined" && (window as any).affiliateManager) {
        
        // Ensure we only track once per browser session device to prevent duplicate leads
        if (!localStorage.getItem("lc_lead_tracked")) {
          const names = session.user.name?.split(" ") || ["Dashboard", "User"];
          const firstName = names[0];
          const lastName = names.slice(1).join(" ");
          
          try {
            (window as any).affiliateManager.trackLead({
              firstName: firstName || "Cargo",
              lastName: lastName || "User",
              email: session.user.email,
            }, () => {
              console.log("Automated Lead tracked via Authentication");
              localStorage.setItem("lc_lead_tracked", "true");
            });
          } catch (e) {
            console.error("Failed to track lead globally", e);
          }
        }
      }
    }
  }, [session, status]);

  return null;
}
