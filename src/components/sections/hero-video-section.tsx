"use client";

import { useState } from "react";
import { BrowserWindow } from "@/components/ui/mock-browser-window";

export function HeroVideoSection() {
  const [sidebarItems] = useState([
    { label: "Overview", active: true },
    { label: "Users", badge: "12" },
    { label: "Analytics", badge: "new" },
    { label: "Settings" },
  ]);

  return (
    <div className="relative px-3 md:px-6 mt-10 w-full max-w-full">
      <div className="relative w-full max-w-full min-w-0 aspect-video overflow-hidden">
        <BrowserWindow
          variant="chrome"
          headerStyle="full"
          size="xl"
          showSidebar={true}
          sidebarPosition="left"
          url="https://sequence3.se/dashboard"
          sidebarItems={sidebarItems}
          className="h-full w-full max-w-full min-w-0 rounded-xl md:rounded-2xl"
        />
      </div>
    </div>
  );
}
