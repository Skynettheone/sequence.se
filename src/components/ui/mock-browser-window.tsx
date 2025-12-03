"use client"

import type React from "react"
// import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarItem {
  icon?: React.ReactNode
  label: string
  active?: boolean
  badge?: string | number
}

interface WindowControlsProps {
  variant?: "macos" | "windows" | "chrome" | "safari"
  headerStyle?: "minimal" | "full"
}

interface AddressBarProps {
  url?: string
  secure?: boolean
  variant?: "chrome" | "safari"
  className?: string
}

interface SidebarContentProps {
  items?: SidebarItem[]
  variant?: "navigation" | "bookmarks" | "history" | "extensions"
  className?: string
}

interface BrowserWindowProps {
  children?: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  showSidebar?: boolean
  sidebarPosition?: "left" | "right" | "top" | "bottom"
  headerStyle?: "minimal" | "full"
  variant?: "chrome" | "safari" | "generic"
  theme?: "light" | "dark" | "auto"
  url?: string
  sidebarItems?: Array<{
    icon?: React.ReactNode
    label: string
    active?: boolean
    badge?: string | number
  }>
}

function WindowControls({
  variant = "macos",
  headerStyle = "full",
}: WindowControlsProps) {
  const sizeClasses = "size-1.5 md:size-2"

  if (variant === "macos" || variant === "safari") {
    const dotColors =
      headerStyle === "minimal"
        ? {
            red: "bg-muted border  border-foreground/20",
            yellow: "bg-muted border border-foreground/20",
            green: "bg-muted border border-foreground/20",
          }
        : {
            red: "bg-red-500 hover:bg-red-600 border border-foreground/20",
            yellow:
              "bg-yellow-500 hover:bg-yellow-600 border border-foreground/20",
            green:
              "bg-green-500 hover:bg-green-600 border border-foreground/20 ",
          }

    return (
      <div className="flex gap-1 md:gap-2">
        <div
          className={cn(
            sizeClasses,
            "rounded-full",
            dotColors.red,
            "transition-colors cursor-pointer flex items-center justify-center group"
          )}
        >
          {headerStyle !== "minimal" && (
            <div className="w-1.5 h-0.5 bg-red-900/60 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          )}
        </div>
        <div
          className={cn(
            sizeClasses,
            "rounded-full",
            dotColors.yellow,
            "transition-colors cursor-pointer flex items-center justify-center group"
          )}
        >
          {headerStyle !== "minimal" && (
            <div className="w-1.5 h-0.5 bg-yellow-900/60 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          )}
        </div>
        <div
          className={cn(
            sizeClasses,
            "rounded-full",
            dotColors.green,
            "transition-colors cursor-pointer flex items-center justify-center group"
          )}
        >
          {headerStyle !== "minimal" && (
            <div className="w-1 h-1 border border-green-900/60 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          )}
        </div>
      </div>
    )
  }

  if (variant === "windows") {
    return (
      <div className="flex gap-0.5 md:gap-1">
        <div className="w-5 h-3 md:w-6 md:h-4 bg-muted/50 hover:bg-muted transition-colors cursor-pointer flex items-center justify-center">
          <div className="w-1.5 h-0.5 md:w-2 md:h-0.5 bg-foreground/60"></div>
        </div>
        <div className="w-5 h-3 md:w-6 md:h-4 bg-muted/50 hover:bg-muted transition-colors cursor-pointer flex items-center justify-center">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 border border-foreground/60"></div>
        </div>
        <div className="w-5 h-3 md:w-6 md:h-4 bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer flex items-center justify-center">
          <div className="w-1.5 h-0.5 md:w-2 md:h-0.5 bg-white rotate-45"></div>
          <div className="w-1.5 h-0.5 md:w-2 md:h-0.5 bg-white -rotate-45 absolute"></div>
        </div>
      </div>
    )
  }

  if (variant === "chrome") {
    return (
      <div className="flex gap-1 md:gap-1.5">
        <div
          className={cn(
            sizeClasses,
            "rounded-full bg-red-500 hover:bg-red-600 transition-colors cursor-pointer"
          )}
        ></div>
        <div
          className={cn(
            sizeClasses,
            "rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors cursor-pointer"
          )}
        ></div>
        <div
          className={cn(
            sizeClasses,
            "rounded-full bg-green-500 hover:bg-green-600 transition-colors cursor-pointer"
          )}
        ></div>
      </div>
    )
  }

  return (
    <div className="flex gap-1 md:gap-1.5">
      <div
        className={`${sizeClasses} rounded-full border border-foreground/20 bg-foreground/10`}
      ></div>
      <div
        className={`${sizeClasses} rounded-full border border-foreground/20 bg-foreground/10`}
      ></div>
      <div
        className={`${sizeClasses} rounded-full border border-foreground/20 bg-foreground/10`}
      ></div>
    </div>
  )
}

function AddressBar({
  url = "https://example.com",
  secure = true,
  variant = "chrome",
  className = "",
}: AddressBarProps) {
  const variantStyles = {
    chrome:
      "bg-muted/30 rounded-full border border-foreground/5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.03)_inset] backdrop-blur-sm",
    safari:
      "bg-muted/20 rounded-lg border border-foreground/5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.03)_inset] backdrop-blur-sm",
  }

  const iconColors = {
    chrome: "text-muted-foreground/60",
    safari: "text-muted-foreground/60",
  }

  return (
    <div className={`flex-1 flex justify-center ${className}`}>
      <div
        className={cn(
          variantStyles[variant],
          "px-2 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs text-muted-foreground/70 min-w-[120px] md:min-w-[200px] max-w-md flex items-center gap-1 md:gap-2 transition-colors"
        )}
      >
        {secure && (
          <div className={cn("w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0", iconColors[variant])}>
            <svg viewBox="0 0 12 12" fill="currentColor">
              <title>Secure</title>
              <path d="M6 1a2.5 2.5 0 0 1 2.5 2.5V5h.5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h.5V3.5A2.5 2.5 0 0 1 6 1z" />
            </svg>
          </div>
        )}
        <span className="truncate">{url}</span>
      </div>
    </div>
  )
}

function SidebarContent({
  items = [
    { label: "Dashboard", active: true },
    { label: "Analytics", badge: "3" },
    { label: "Settings" },
    { label: "Profile" },
  ],
  className = "",
}: SidebarContentProps) {
  return (
    <div className={cn("p-2 md:p-3 space-y-1", className)}>
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className={cn(
            "flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2 py-1 md:py-1.5 rounded-full text-xs md:text-sm transition-colors cursor-pointer",
            item.active
              ? "bg-secondary/10 text-secondary border border-secondary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
          )}
        >
          {item.icon && (
            <div className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0">{item.icon}</div>
          )}
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <div className="bg-secondary/10 text-secondary text-[10px] md:text-xs px-1 md:px-1.5 py-0.5 rounded-full min-w-[14px] md:min-w-[16px] text-center font-medium">
              {item.badge}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function DashboardContent() {
  return (
    <div className="absolute inset-0 w-full h-full bg-background overflow-y-auto flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="w-full max-w-md px-3 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-10">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight mb-1.5 sm:mb-2">
            Dashboard
          </h2>
          <p className="text-[11px] sm:text-xs md:text-sm lg:text-base text-muted-foreground px-1 sm:px-2">
            Welcome back! Here's what's happening today.
          </p>
        </div>

        {/* Quick Actions - Using Button component */}
        <div className="flex flex-col gap-2.5 sm:gap-3 md:gap-4">
          <Button
            variant="secondary"
            size="default"
            className="w-full !rounded-full text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11 px-3 sm:px-4 md:px-6"
          >
            New Conversation
          </Button>
          <Button
            variant="outline"
            size="default"
            className="w-full !rounded-full text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11 px-3 sm:px-4 md:px-6"
          >
            View Analytics
          </Button>
          <Button
            variant="ghost"
            size="default"
            className="w-full !rounded-full text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11 px-3 sm:px-4 md:px-6"
          >
            Settings
          </Button>
        </div>
      </div>
    </div>
  )
}

export function BrowserWindow({
  children,
  className = "",
  size = "md",
  showSidebar = false,
  sidebarPosition = "left",
  headerStyle = "minimal",
  variant = "generic",
  theme = "auto",
  url,
  sidebarItems,
}: BrowserWindowProps) {
  const sizeClasses = {
    sm: "h-64 max-w-sm",
    md: "h-80 max-w-2xl",
    lg: "h-96 max-w-4xl",
    xl: "h-[32rem] max-w-6xl",
  }

  const sidebarSizes = {
    sm: "w-16 md:w-32",
    md: "w-20 md:w-48",
    lg: "w-24 md:w-56",
    xl: "w-28 md:w-64",
  }

  const themeClasses =
    theme === "dark"
      ? "bg-background border-border"
      : theme === "light"
        ? "bg-background border-border"
        : "bg-background border-border"

  const getHeaderStyles = () => {
    const baseStyles =
      "h-9 md:h-11 border-b border-foreground/5 flex items-center px-2 md:px-4"

    if (variant === "chrome") {
      return `${baseStyles} bg-muted/10 overflow-hidden`
    }

    if (variant === "safari") {
      return `${baseStyles} bg-muted/10 overflow-hidden border-b border-border/30`
    }

    return `${baseStyles} bg-muted/20`
  }

  return (
    <div
      className={cn(
        "relative mask-b-from-50% rounded-2xl border shadow-[0px_1px_1px_0px_rgba(0,_0,_0,_0.05),_0px_1px_1px_0px_rgba(255,_252,_240,_0.5)_inset,_0px_0px_0px_1px_hsla(0,_0%,_100%,_0.1)_inset,_0px_0px_1px_0px_rgba(28,_27,_26,_0.5)] dark:shadow-[0px_1px_1px_0px_rgba(0,_0,_0,_0.2),_0px_1px_1px_0px_rgba(0,_0,_0,_0.3)_inset,_0px_0px_0px_1px_hsla(0,_0%,_0%,_0.2)_inset,_0px_0px_1px_0px_rgba(255,_255,_255,_0.1)]",
        sizeClasses[size],
        themeClasses,
        "flex flex-col",
        "w-full max-w-full",
        "overflow-hidden",
        className
      )}
    >
      <div className={getHeaderStyles()}>
        <WindowControls
          variant={variant === "generic" ? "macos" : variant}
          headerStyle={headerStyle}
        />

        {headerStyle === "full" && (
          <AddressBar
            url={url}
            variant={variant === "generic" ? "chrome" : variant}
            className="ml-2 md:ml-4"
          />
        )}
      </div>

      {showSidebar && sidebarPosition === "top" && (
        <div className="border-b border-foreground/5 bg-muted/20 h-12 md:h-16">
          <SidebarContent
            items={sidebarItems}
            variant="navigation"
            className="flex-row"
          />
        </div>
      )}

      <div className="flex flex-1 h-0 min-w-0 w-full">
        {/* Left Sidebar */}
        {showSidebar && sidebarPosition === "left" && (
          <div
            className={cn(
              "border-r border-foreground/5 bg-muted/20 flex-shrink-0 h-full",
              sidebarSizes[size]
            )}
          >
            <SidebarContent items={sidebarItems} />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 relative min-w-0 h-full overflow-hidden w-full bg-background">
          {children || <DashboardContent />}
        </div>

        {/* Right Sidebar */}
        {showSidebar && sidebarPosition === "right" && (
          <div
            className={cn(
              "border-l border-foreground/5 bg-muted/20 flex-shrink-0 h-full",
              sidebarSizes[size]
            )}
          >
            <SidebarContent items={sidebarItems} />
          </div>
        )}
      </div>

      {/* Bottom Sidebar */}
      {showSidebar && sidebarPosition === "bottom" && (
        <div className="border-t border-foreground/5 bg-muted/20 h-12 md:h-16">
          <SidebarContent
            items={sidebarItems}
            variant="navigation"
            className="flex-row"
          />
        </div>
      )}
    </div>
  )
}
