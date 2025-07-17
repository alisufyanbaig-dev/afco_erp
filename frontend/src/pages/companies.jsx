import React, { useState, useEffect } from 'react'
import { Plus, Building, MapPin, Phone, Mail, Globe, Check, Search, Edit, Trash2, Eye } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import CompanyForm from '@/components/forms/CompanyForm'
import { companyService } from '@/services/api'
import { useUserActivity } from '@/contexts/UserActivityContext'
import toast from 'react-hot-toast'

const Companies = () => {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  })
  const { userActivity, activateCompany } = useUserActivity()

  // Load companies when filters change
  useEffect(() => {
    fetchCompanies();
  }, [pagination.page, searchTerm]);

  // Table columns configuration
  const columns = [
    {
      accessorKey: 'name',
      header: 'Company Name',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Building className="h-8 w-8 p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {row.original.name}
            </div>
            {row.original.legal_name && row.original.legal_name !== row.original.name && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {row.original.legal_name}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'business_type_display',
      header: 'Business Type',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.business_type_display}
        </Badge>
      )
    },
    {
      accessorKey: 'city',
      header: 'Location',
      cell: ({ row }) => (
        <div className="flex items-center space-x-1 text-sm">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span>
            {row.original.city}, {row.original.province_display}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'contact',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.phone && (
            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
              <Phone className="h-3 w-3" />
              <span>{row.original.phone}</span>
            </div>
          )}
          {row.original.email && (
            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
              <Mail className="h-3 w-3" />
              <span>{row.original.email}</span>
            </div>
          )}
        </div>
      )
    },
    {
      accessorKey: 'activation_status',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = userActivity.current_company === row.original.id
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
                onClick={() => handleActivateCompany(row.original)}
                className="text-xs"
                disabled={userActivity.activating}
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

  // Fetch companies data
  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
        search: searchTerm
      }

      const response = await companyService.list(params)
      
      if (response.success) {
        setCompanies(response.data.results || response.data)
        setPagination(prev => ({
          ...prev,
          total: response.data.count || response.data.length
        }))
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
      toast.error('Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  // Handle edit company
  const handleEdit = (company) => {
    setSelectedCompany(company)
    setShowEditForm(true)
  }

  // Handle delete company
  const handleDelete = async (company) => {
    if (window.confirm(`Are you sure you want to delete "${company.name}"?`)) {
      try {
        const result = await companyService.delete(company.id)
        if (result.success) {
          fetchCompanies() // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting company:', error)
        toast.error('Failed to delete company')
      }
    }
  }

  // Handle create new company
  const handleCreate = () => {
    setShowCreateForm(true)
  }

  // Handle form success (refresh data)
  const handleFormSuccess = () => {
    fetchCompanies()
  }

  // Handle edit form close
  const handleEditFormClose = (open) => {
    setShowEditForm(open)
    if (!open) {
      setSelectedCompany(null)
    }
  }

  // Handle activate company
  const handleActivateCompany = async (company) => {
    try {
      await activateCompany(company.id)
      // No need to refresh the list, the context will update and trigger re-render
    } catch (error) {
      console.error('Error activating company:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your company information and settings
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search companies..."
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
          data={companies}
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

      {/* Create Company Form */}
      <CompanyForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={handleFormSuccess}
      />

      {/* Edit Company Form */}
      <CompanyForm
        open={showEditForm}
        onOpenChange={handleEditFormClose}
        onSuccess={handleFormSuccess}
        company={selectedCompany}
      />
    </div>
  )
}

export default Companies