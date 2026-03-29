'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function PartnerPortal() {
  const { data: session } = useSession();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  
  const currentUserId = (session?.user as any)?.id;
  const currentUserEmail = session?.user?.email;

  useEffect(() => {
    if (isScriptLoaded && window.RefRef && currentUserEmail) {
      console.log('Initializing RefRef with email:', currentUserEmail);
      window.RefRef.init({
        programId: process.env.NEXT_PUBLIC_REFREF_PROGRAM_ID,
        externalId: currentUserEmail
      });
    }
  }, [isScriptLoaded, currentUserEmail]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Please sign in to access the Partner Portal.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Partner Dashboard</h1>
        <p className="mb-8 text-gray-600">Click the button below to open your referral dashboard, generate links, and track commissions.</p>
        
        {/* The data-refref-trigger attribute automatically binds to the RefRef widget */}
        <button 
          data-refref-trigger
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow transition-colors"
        >
          Open Affiliate Dashboard
        </button>

        {/* Load the official Widget script */}
        <Script 
          src="https://assets.refref.ai/widget.js" 
          strategy="afterInteractive"
          onLoad={() => setIsScriptLoaded(true)}
        />
      </div>
    </div>
  );
}

// Type declaration to prevent TypeScript errors for window.RefRef
declare global {
  interface Window {
    RefRef: any;
  }
}
