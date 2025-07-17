import * as React from "react"
import { useNavigate, useLocation } from "react-router-dom"
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
import { useAuth } from "@/contexts/AuthContext"
import { useUI } from "@/contexts/UIContext"
import { useTheme } from "@/contexts/ThemeContext"
import { useUserActivity } from "@/contexts/UserActivityContext"
import ActivityBadge from "@/components/ui/activity-badge"
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
  LogOut,
  Sun,
  Moon,
  Receipt,
  DollarSign,
  FileText,
  CreditCard,
  TrendingUp,
  Tag,
  Truck,
  Warehouse,
  Archive,
  Building,
  Calendar,
  Banknote,
  Landmark,
  BookOpen,
  PieChart
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
      { title: "Chart of Accounts", icon: BookOpen, href: "/chart-of-accounts" },
      { title: "Vouchers", icon: Receipt, href: "/vouchers" },
      { title: "Ledger Report", icon: BookOpen, href: "/ledger-report" },
      { title: "Trial Balance", icon: Calculator, href: "/trial-balance" },
      { title: "Financial Reports", icon: PieChart, href: "/accounting/reports" },
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
    children: [
      { title: "Companies", icon: Building, href: "/companies" },
      { title: "Financial Years", icon: Calendar, href: "/financial-years" },
      { title: "General Settings", icon: Settings, href: "/settings" },
    ],
  },
]

export function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [expandedItems, setExpandedItems] = React.useState({})
  const { logout } = useAuth()
  const { sidebarCollapsed, setSidebarCollapsed } = useUI()
  const { theme, toggleTheme } = useTheme()
  const { userActivity } = useUserActivity()
  const [isHovered, setIsHovered] = React.useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname

  const toggleExpanded = (title) => {
    // Don't expand if sidebar is collapsed and not hovered
    if (sidebarCollapsed && !isHovered) {
      return
    }
    setExpandedItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  const handleNavigation = (href) => {
    navigate(href)
    setSidebarOpen(false)
  }

  const handleLogout = () => {
    logout()
  }

  const handleThemeToggle = () => {
    if (toggleTheme) {
      toggleTheme();
    }
  }

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const shouldShowText = !sidebarCollapsed || isHovered

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out lg:translate-x-0",
          sidebarCollapsed && !isHovered ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          isHovered && sidebarCollapsed ? "shadow-lg" : ""
        )}
        onMouseEnter={() => sidebarCollapsed && setIsHovered(true)}
        onMouseLeave={() => sidebarCollapsed && setIsHovered(false)}
      >
        <Sidebar className="overflow-hidden bg-white dark:bg-gray-800">
          <SidebarHeader className={cn(
            "transition-all duration-300",
            sidebarCollapsed && !isHovered ? "px-0" : "px-4"
          )}>
            {sidebarCollapsed && !isHovered ? (
              <div className="flex items-center justify-center w-full h-full">
                <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">A</h2>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 truncate">AFCO ERP</h2>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </Button>
              </div>
            )}
          </SidebarHeader>
          
          <SidebarContent className={cn(
            "transition-all duration-300",
            sidebarCollapsed && !isHovered ? "p-2" : "p-4"
          )}>
            <SidebarNav>
              {navigationItems.map((item) => (
                <SidebarNavGroup key={item.title}>
                  {item.children ? (
                    <div>
                      <SidebarNavItem
                        className={cn(
                          "cursor-pointer transition-all duration-300",
                          sidebarCollapsed && !isHovered ? "justify-center px-2" : "px-3"
                        )}
                        onClick={() => toggleExpanded(item.title)}
                      >
                        <item.icon className={cn(
                          "h-4 w-4 transition-all duration-300 text-gray-700 dark:text-gray-300",
                          sidebarCollapsed && !isHovered ? "mr-0" : "mr-3"
                        )} />
                        {shouldShowText && (
                          <>
                            <span className="truncate">{item.title}</span>
                            <ChevronDown className={cn(
                              "h-4 w-4 ml-auto transition-transform flex-shrink-0 text-gray-700 dark:text-gray-300",
                              expandedItems[item.title] ? "rotate-180" : ""
                            )} />
                          </>
                        )}
                      </SidebarNavItem>
                      {expandedItems[item.title] && shouldShowText && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <SidebarNavItem
                              key={child.href}
                              className="cursor-pointer text-sm px-3"
                              active={pathname === child.href}
                              onClick={() => handleNavigation(child.href)}
                            >
                              <child.icon className="h-3 w-3 mr-2 flex-shrink-0 text-gray-700 dark:text-gray-300" />
                              <span className="truncate">{child.title}</span>
                            </SidebarNavItem>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <SidebarNavItem
                      className={cn(
                        "cursor-pointer transition-all duration-300",
                        sidebarCollapsed && !isHovered ? "justify-center px-2" : "px-3"
                      )}
                      active={pathname === item.href}
                      onClick={() => handleNavigation(item.href)}
                    >
                      <item.icon className={cn(
                        "h-4 w-4 transition-all duration-300 text-gray-700 dark:text-gray-300",
                        sidebarCollapsed && !isHovered ? "mr-0" : "mr-3"
                      )} />
                      {shouldShowText && (
                        <span className="truncate">{item.title}</span>
                      )}
                    </SidebarNavItem>
                  )}
                </SidebarNavGroup>
              ))}
            </SidebarNav>
          </SidebarContent>
        </Sidebar>
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="hidden lg:flex"
                onClick={toggleSidebarCollapse}
              >
                <Menu className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                AFCO ERP Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <ActivityBadge
                company={userActivity.current_company_name}
                financialYear={userActivity.current_financial_year_name}
                loading={userActivity.loading || userActivity.activating}
              />
              <Button variant="outline" size="sm" onClick={handleThemeToggle}>
                {theme === 'dark' ? <Sun className="h-4 w-4 mr-2 text-gray-700 dark:text-gray-300" /> : <Moon className="h-4 w-4 mr-2 text-gray-700 dark:text-gray-300" />}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2 text-gray-700 dark:text-gray-300" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  )
}