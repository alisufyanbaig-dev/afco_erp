import React, { createContext, useContext, useState, useEffect } from 'react'
import { userActivityService } from '../services/api'
import toast from 'react-hot-toast'

const UserActivityContext = createContext()

export const useUserActivity = () => {
  const context = useContext(UserActivityContext)
  if (!context) {
    throw new Error('useUserActivity must be used within a UserActivityProvider')
  }
  return context
}

export const UserActivityProvider = ({ children }) => {
  const [userActivity, setUserActivity] = useState({
    current_company: null,
    current_company_name: null,
    current_financial_year: null,
    current_financial_year_name: null,
    current_financial_year_start_date: null,
    current_financial_year_end_date: null,
    loading: true,
    activating: false
  })

  const fetchUserActivity = async () => {
    try {
      setUserActivity(prev => ({ ...prev, loading: true }))
      const response = await userActivityService.get()
      
      if (response.success) {
        setUserActivity(prev => ({
          ...prev,
          current_company: response.data.current_company,
          current_company_name: response.data.current_company_name,
          current_financial_year: response.data.current_financial_year,
          current_financial_year_name: response.data.current_financial_year_name,
          current_financial_year_start_date: response.data.current_financial_year_start_date,
          current_financial_year_end_date: response.data.current_financial_year_end_date,
          loading: false,
          activating: false
        }))
      }
    } catch (error) {
      console.error('Error fetching user activity:', error)
      setUserActivity(prev => ({ ...prev, loading: false, activating: false }))
    }
  }

  const activateCompany = async (companyId) => {
    try {
      setUserActivity(prev => ({ ...prev, activating: true }))
      const response = await userActivityService.activateCompany(companyId)
      
      if (response.success) {
        setUserActivity(prev => ({
          ...prev,
          current_company: response.data.company_id,
          current_company_name: response.data.company_name,
          current_financial_year: null,
          current_financial_year_name: null,
          activating: false
        }))
        toast.success(response.message)
        return response
      } else {
        setUserActivity(prev => ({ ...prev, activating: false }))
        toast.error(response.message || 'Failed to activate company')
      }
    } catch (error) {
      console.error('Error activating company:', error)
      toast.error(error.message || 'Failed to activate company')
      setUserActivity(prev => ({ ...prev, activating: false }))
      throw error
    }
  }

  const activateFinancialYear = async (financialYearId) => {
    try {
      setUserActivity(prev => ({ ...prev, activating: true }))
      const response = await userActivityService.activateFinancialYear(financialYearId)
      
      if (response.success) {
        setUserActivity(prev => ({
          ...prev,
          current_company: response.data.company_id,
          current_company_name: response.data.company_name,
          current_financial_year: response.data.financial_year_id,
          current_financial_year_name: response.data.financial_year_name,
          current_financial_year_start_date: response.data.financial_year_start_date,
          current_financial_year_end_date: response.data.financial_year_end_date,
          activating: false
        }))
        toast.success(response.message)
        return response
      } else {
        setUserActivity(prev => ({ ...prev, activating: false }))
        toast.error(response.message || 'Failed to activate financial year')
      }
    } catch (error) {
      console.error('Error activating financial year:', error)
      toast.error(error.message || 'Failed to activate financial year')
      setUserActivity(prev => ({ ...prev, activating: false }))
      throw error
    }
  }

  const refreshActivity = () => {
    fetchUserActivity()
  }

  useEffect(() => {
    fetchUserActivity()
  }, [])

  const value = {
    userActivity,
    activateCompany,
    activateFinancialYear,
    refreshActivity
  }

  return (
    <UserActivityContext.Provider value={value}>
      {children}
    </UserActivityContext.Provider>
  )
}

export default UserActivityProvider