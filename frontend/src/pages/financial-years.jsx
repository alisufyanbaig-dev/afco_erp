import React, { useState, useEffect } from 'react'
import { Calendar, Building2, Star, Clock, Check, Plus, Search, Edit, Trash2 } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import FinancialYearForm from '@/components/forms/FinancialYearForm'
import { financialYearService } from '@/services/api'
import { useUserActivity } from '@/contexts/UserActivityContext'
import toast from 'react-hot-toast'

const FinancialYears = () => {
  const [financialYears, setFinancialYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  })
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedFinancialYear, setSelectedFinancialYear] = useState(null)
  const { userActivity, activateFinancialYear } = useUserActivity()

  // Table columns configuration
  const columns = [
    {
      accessorKey: 'name',
      header: 'Financial Year',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Calendar className="h-8 w-8 p-1.5 bg-green-100 dark:bg-green-900 rounded-lg text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <span>{row.original.name}</span>
              {row.original.is_current && (
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(row.original.start_date).toLocaleDateString()} - {new Date(row.original.end_date).toLocaleDateString()}
            </div>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'company_name',
      header: 'Company',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium">{row.original.company_name}</span>
        </div>
      )
    },
    {
      accessorKey: 'duration_months',
      header: 'Duration',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm">
            {row.original.duration_months} {row.original.duration_months === 1 ? 'month' : 'months'}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'period',
      header: 'Period',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">
            Start: {new Date(row.original.start_date).toLocaleDateString()}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            End: {new Date(row.original.end_date).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'activation_status',
      header: 'Activation',
      cell: ({ row }) => {
        const isActive = userActivity.current_financial_year === row.original.id
        return (
          <div className="flex items-center gap-2">
            {isActive ? (
              <Badge variant="success" className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Active
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleActivateFinancialYear(row.original)}
                className="text-xs"
                disabled={!userActivity.current_company || userActivity.activating}
              >
                {userActivity.activating ? 'Activating...' : 'Activate'}
              </Button>
            )}
          </div>
        )
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  // Fetch financial years data
  const fetchFinancialYears = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
        search: searchTerm
      }

      const response = await financialYearService.list(params)
      
      if (response.success) {
        setFinancialYears(response.data.results || response.data)
        setPagination(prev => ({
          ...prev,
          total: response.data.count || response.data.length
        }))
      }
    } catch (error) {
      console.error('Error fetching financial years:', error)
      toast.error('Failed to load financial years')
    } finally {
      setLoading(false)
    }
  }

  // Load financial years when filters change
  useEffect(() => {
    fetchFinancialYears()
  }, [pagination.page, searchTerm])


  // Handle edit financial year
  const handleEdit = (fy) => {
    setSelectedFinancialYear(fy)
    setShowEditForm(true)
  }

  // Handle delete financial year
  const handleDelete = async (fy) => {
    if (window.confirm(`Are you sure you want to delete "${fy.name}"?`)) {
      try {
        await financialYearService.delete(fy.id)
        fetchFinancialYears() // Refresh the list
      } catch (error) {
        console.error('Error deleting financial year:', error)
      }
    }
  }

  // Handle create new financial year
  const handleCreate = () => {
    setShowCreateForm(true)
  }

  // Handle form success (refresh data)
  const handleFormSuccess = () => {
    fetchFinancialYears()
  }

  // Handle activate financial year
  const handleActivateFinancialYear = async (financialYear) => {
    try {
      await activateFinancialYear(financialYear.id)
      // No need to refresh the list, the context will update and trigger re-render
    } catch (error) {
      console.error('Error activating financial year:', error)
    }
  }

  return (
    <div className="space-y-6">
      {!userActivity.current_company && !userActivity.loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Company Activated
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Please activate a company first to view and manage financial years.
          </p>
          <Button
            onClick={() => window.location.href = '/companies'}
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Go to Companies
          </Button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Financial Years</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage financial years and accounting periods
              </p>
            </div>
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Financial Year
            </Button>
          </div>

          {/* Search */}
          <Card className="p-6">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search financial years..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </Card>

          {/* Data Table */}
          <Card>
            <DataTable
              data={financialYears}
              columns={columns}
              loading={loading}
              pagination={{
                pageIndex: pagination.page - 1,
                pageSize: pagination.pageSize,
                pageCount: Math.ceil(pagination.total / pagination.pageSize)
              }}
              onPaginationChange={(updater) => {
                const newPagination = typeof updater === 'function' 
                  ? updater({ pageIndex: pagination.page - 1, pageSize: pagination.pageSize })
                  : updater;
                
                setPagination(prev => ({
                  ...prev,
                  page: newPagination.pageIndex + 1,
                  pageSize: newPagination.pageSize
                }));
              }}
            />
          </Card>
        </>
      )}

      {/* Create Financial Year Form */}
      <FinancialYearForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={handleFormSuccess}
      />

      {/* Edit Financial Year Form */}
      <FinancialYearForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onSuccess={handleFormSuccess}
        financialYear={selectedFinancialYear}
      />
    </div>
  )
}

export default FinancialYears