import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import TestComponent from "../test-component"
import { 
  DollarSign, 
  Users, 
  Package, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  Eye
} from "lucide-react"

const stats = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    description: "+20.1% from last month",
    icon: DollarSign,
    trend: "up",
    color: "text-green-600 dark:text-green-400"
  },
  {
    title: "Active Customers",
    value: "2,350",
    description: "+180 from last month",
    icon: Users,
    trend: "up",
    color: "text-blue-600 dark:text-blue-400"
  },
  {
    title: "Products in Stock",
    value: "12,234",
    description: "+19% from last month",
    icon: Package,
    trend: "up",
    color: "text-purple-600 dark:text-purple-400"
  },
  {
    title: "Growth Rate",
    value: "12.5%",
    description: "+4.5% from last month",
    icon: TrendingUp,
    trend: "up",
    color: "text-orange-600 dark:text-orange-400"
  },
]

const recentTransactions = [
  {
    id: 1,
    type: "Invoice",
    customer: "Acme Corp",
    amount: "$2,500.00",
    status: "Paid",
    date: "2024-01-15"
  },
  {
    id: 2,
    type: "Payment",
    customer: "Tech Solutions",
    amount: "$1,800.00",
    status: "Pending",
    date: "2024-01-14"
  },
  {
    id: 3,
    type: "Expense",
    customer: "Office Supplies",
    amount: "$450.00",
    status: "Approved",
    date: "2024-01-13"
  },
  {
    id: 4,
    type: "Invoice",
    customer: "Global Industries",
    amount: "$3,200.00",
    status: "Paid",
    date: "2024-01-12"
  },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* CSS Test Component */}
      <TestComponent />
      
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Welcome back!</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <p className="text-xs text-muted-foreground dark:text-gray-400 flex items-center">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                )}
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest financial activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{transaction.customer}</p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400">{transaction.type} • {transaction.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      transaction.status === "Paid" ? "default" : 
                      transaction.status === "Pending" ? "secondary" : 
                      "outline"
                    }>
                      {transaction.status}
                    </Badge>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{transaction.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Frequently used actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Add Product
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}