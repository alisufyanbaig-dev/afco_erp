import React from 'react'
import { Building, Calendar, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const ActivityBadge = ({ 
  company, 
  financialYear, 
  loading = false, 
  className = '',
  onClick = null 
}) => {
  if (loading) {
    return (
      <div className={cn(
        "flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md border animate-pulse",
        className
      )}>
        <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div className="w-14 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className={cn(
        "flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800",
        onClick && "cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors",
        className
      )}
      onClick={onClick}
      >
        <Building className="w-3 h-3" />
        <span className="text-xs font-medium">No Company Selected</span>
        {onClick && <ChevronDown className="w-2.5 h-2.5" />}
      </div>
    )
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-0.5 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm",
      onClick && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
      className
    )}
    onClick={onClick}
    >
      {/* Company Info */}
      <div className="flex items-center gap-1.5">
        <div className="p-0.5 bg-blue-100 dark:bg-blue-900 rounded">
          <Building className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400">Company</div>
          <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate max-w-[84px]" title={company}>
            {company}
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>

      {/* Financial Year Info */}
      <div className="flex items-center gap-1.5">
        <div className="p-0.5 bg-green-100 dark:bg-green-900 rounded">
          <Calendar className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400">Financial Year</div>
          <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate max-w-[70px]" title={financialYear || 'Not Selected'}>
            {financialYear || 'Not Selected'}
          </div>
        </div>
      </div>

      {onClick && <ChevronDown className="w-3 h-3 text-gray-400" />}
    </div>
  )
}

export default ActivityBadge