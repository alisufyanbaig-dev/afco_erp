import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarNav, 
  SidebarNavHeader, 
  SidebarNavItem, 
  SidebarNavGroup 
} from "@/components/ui/sidebar"
import { 
  Menu, 
  X, 
  ChevronDown, 
  Home, 
  Calculator, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  User,
  Receipt,
  DollarSign,
  FileText,
  CreditCard,
  TrendingUp,
  Tag,
  Truck,
  Warehouse,
  Archive
} from "lucide-react"

const navigationItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/dashboard",
  },
  {
    title: "Accounting",
    icon: Calculator,
    children: [
      { title: "Chart of Accounts", icon: Calculator, href: "/accounting/accounts" },
      { title: "Transactions", icon: Receipt, href: "/accounting/transactions" },
      { title: "Invoices", icon: FileText, href: "/accounting/invoices" },
      { title: "Payments", icon: CreditCard, href: "/accounting/payments" },
      { title: "Financial Reports", icon: TrendingUp, href: "/accounting/reports" },
    ],
  },
  {
    title: "Inventory",
    icon: Package,
    children: [
      { title: "Products", icon: Package, href: "/inventory/products" },
      { title: "Categories", icon: Tag, href: "/inventory/categories" },
      { title: "Suppliers", icon: Truck, href: "/inventory/suppliers" },
      { title: "Warehouse", icon: Warehouse, href: "/inventory/warehouse" },
      { title: "Stock Movements", icon: Archive, href: "/inventory/stock-movements" },
    ],
  },
  {
    title: "Orders",
    icon: ShoppingCart,
    href: "/orders",
  },
  {
    title: "Customers",
    icon: Users,
    href: "/customers",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/analytics",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
  {
    title: "Profile",
    icon: User,
    href: "/profile",
  },
]

export function DashboardLayout({ children, pathname, navigate }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [expandedItems, setExpandedItems] = React.useState({})

  const toggleExpanded = (title) => {
    setExpandedItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  const handleNavigation = (href) => {
    navigate(href)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-blue-600">AFCO ERP</h2>
              <Button 
                variant="ghost" 
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarNav>
              {navigationItems.map((item) => (
                <SidebarNavGroup key={item.title}>
                  {item.children ? (
                    <div>
                      <SidebarNavItem
                        className="cursor-pointer"
                        onClick={() => toggleExpanded(item.title)}
                      >
                        <item.icon className="h-4 w-4 mr-3" />
                        {item.title}
                        <ChevronDown className={cn(
                          "h-4 w-4 ml-auto transition-transform",
                          expandedItems[item.title] ? "rotate-180" : ""
                        )} />
                      </SidebarNavItem>
                      {expandedItems[item.title] && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <SidebarNavItem
                              key={child.href}
                              className="cursor-pointer text-sm"
                              active={pathname === child.href}
                              onClick={() => handleNavigation(child.href)}
                            >
                              <child.icon className="h-3 w-3 mr-2" />
                              {child.title}
                            </SidebarNavItem>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <SidebarNavItem
                      className="cursor-pointer"
                      active={pathname === item.href}
                      onClick={() => handleNavigation(item.href)}
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.title}
                    </SidebarNavItem>
                  )}
                </SidebarNavGroup>
              ))}
            </SidebarNav>
          </SidebarContent>
        </Sidebar>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                AFCO ERP Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}