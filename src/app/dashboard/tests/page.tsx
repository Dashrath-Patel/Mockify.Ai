"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { MockTests } from "@/components/MockTests";

export default function TestsPage() {
  const [hideSidebar, setHideSidebar] = useState(false);

  // Listen for test state changes via custom event
  useEffect(() => {
    const handleTestStateChange = (event: CustomEvent) => {
      setHideSidebar(event.detail.hideInterface);
    };

    window.addEventListener('test-interface-change' as any, handleTestStateChange);
    return () => window.removeEventListener('test-interface-change' as any, handleTestStateChange);
  }, []);

  return (
    <AppLayout hideSidebar={hideSidebar}>
      <MockTests />
    </AppLayout>
  );
}
