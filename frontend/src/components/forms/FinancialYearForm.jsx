import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { financialYearService } from '@/services/api'
import toast from 'react-hot-toast'

const FinancialYearForm = ({ open, onOpenChange, onSuccess, financialYear = null }) => {
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: financialYear?.name || '',
    start_date: financialYear?.start_date || '',
    end_date: financialYear?.end_date || '',
  })

  const [errors, setErrors] = useState({})

  // Update form data when financialYear prop changes
  useEffect(() => {
    if (financialYear) {
      setFormData({
        name: financialYear.name || '',
        start_date: financialYear.start_date || '',
        end_date: financialYear.end_date || '',
      })
    } else {
      setFormData({
        name: '',
        start_date: '',
        end_date: '',
      })
    }
  }, [financialYear])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }

    // Auto-generate financial year name when dates change
    if (name === 'start_date' || name === 'end_date') {
      const startYear = name === 'start_date' ? new Date(value).getFullYear() : new Date(formData.start_date).getFullYear()
      const endYear = name === 'end_date' ? new Date(value).getFullYear() : new Date(formData.end_date).getFullYear()
      
      if (startYear && endYear && !isNaN(startYear) && !isNaN(endYear)) {
        const newName = `FY ${startYear}-${endYear.toString().slice(-2)}`
        setFormData(prev => ({
          ...prev,
          [name]: value,
          name: newName
        }))
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Financial year name is required'
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required'
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required'
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      
      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date'
      }

      // Check if the period is too short (less than 1 month) or too long (more than 18 months)
      let monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())
      
      // Add 1 if the end date is at or after the start date of the month
      if (endDate.getDate() >= startDate.getDate()) {
        monthsDiff += 1
      }
      
      if (monthsDiff < 1) {
        newErrors.end_date = 'Financial year must be at least 1 month'
      } else if (monthsDiff > 18) {
        newErrors.end_date = 'Financial year cannot exceed 18 months'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // Clean up form data
      const submitData = { ...formData }

      let result
      if (financialYear) {
        // Update existing financial year
        result = await financialYearService.update(financialYear.id, submitData)
      } else {
        // Create new financial year
        result = await financialYearService.create(submitData)
      }

      if (result.success) {
        onSuccess()
        onOpenChange(false)
        
        // Reset form for create mode
        if (!financialYear) {
          setFormData({
            name: '',
            start_date: '',
            end_date: '',
          })
        }
      }
    } catch (error) {
      if (error.errors) {
        setErrors(error.errors)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{financialYear ? 'Edit Financial Year' : 'Create New Financial Year'}</DialogTitle>
          <DialogDescription>
            {financialYear ? 'Update financial year information' : 'Enter financial year details to create a new financial year record'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Financial Year Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Financial Year Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., FY 2024-25"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                className={errors.start_date ? 'border-red-500' : ''}
              />
              {errors.start_date && <p className="text-sm text-red-500">{errors.start_date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                className={errors.end_date ? 'border-red-500' : ''}
              />
              {errors.end_date && <p className="text-sm text-red-500">{errors.end_date}</p>}
            </div>
          </div>

          {/* Duration Display */}
          {formData.start_date && formData.end_date && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Duration: {(() => {
                  const start = new Date(formData.start_date)
                  const end = new Date(formData.end_date)
                  
                  // Calculate the difference in months, including the end month
                  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
                  
                  // Add 1 if the end date is at or after the start date of the month
                  if (end.getDate() >= start.getDate()) {
                    months += 1
                  }
                  
                  return `${months} ${months === 1 ? 'month' : 'months'}`
                })()}
              </p>
            </div>
          )}


          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : financialYear ? 'Update Financial Year' : 'Create Financial Year'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default FinancialYearForm