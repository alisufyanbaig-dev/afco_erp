import * as React from "react"
import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"

const sidebarVariants = cva(
  "flex h-full w-64 flex-col border-r bg-background",
  {
    variants: {
      variant: {
        default: "border-border",
        inset: "border-none bg-sidebar",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Sidebar = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(sidebarVariants({ variant }), className)}
    {...props}
  />
))
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between p-4 border-b", className)}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-auto p-4", className)}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-4 border-t", className)}
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"

const SidebarNav = React.forwardRef(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    className={cn("space-y-2", className)}
    {...props}
  />
))
SidebarNav.displayName = "SidebarNav"

const SidebarNavHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider", className)}
    {...props}
  />
))
SidebarNavHeader.displayName = "SidebarNavHeader"

const SidebarNavItem = React.forwardRef(({ className, active, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
      active 
        ? "bg-blue-100 text-blue-900" 
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
      className
    )}
    {...props}
  />
))
SidebarNavItem.displayName = "SidebarNavItem"

const SidebarNavGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-1", className)}
    {...props}
  />
))
SidebarNavGroup.displayName = "SidebarNavGroup"

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarNav,
  SidebarNavHeader,
  SidebarNavItem,
  SidebarNavGroup,
}