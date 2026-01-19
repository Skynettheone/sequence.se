"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { InactivityHandler } from "@/components/inactivity-handler";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't show sidebar for login page
  if (pathname === "/dashboard/login") {
    return <>{children}</>;
  }

  // Get breadcrumb items based on current path
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (pathname === "/dashboard") {
      return [{ label: "Posts" }];
    }
    if (pathname === "/dashboard/posts/new") {
      return [
        { label: "Posts", href: "/dashboard" },
        { label: "New Post" },
      ];
    }
    if (pathname.startsWith("/dashboard/posts/")) {
      return [
        { label: "Posts", href: "/dashboard" },
        { label: "Edit Post" },
      ];
    }
    if (pathname === "/dashboard/settings") {
      return [{ label: "Settings" }];
    }
    return [{ label: "Dashboard" }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <InactivityHandler>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="bg-background sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {item.href ? (
                        <BreadcrumbLink asChild>
                          <Link href={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </InactivityHandler>
  );
}

