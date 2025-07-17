import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  headerClassName = '',
  contentClassName = '',
  overlayClassName = ''
}) => {
  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    extraLarge: 'max-w-6xl',
    full: 'max-w-full mx-4'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/70 transition-opacity duration-300",
          overlayClassName
        )}
        onClick={handleOverlayClick}
      />
      
      {/* Modal Content */}
      <div 
        className={cn(
          "relative bg-white dark:bg-gray-900 rounded-lg shadow-xl border max-h-[90vh] overflow-hidden w-full mx-4",
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={cn(
            "flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700",
            headerClassName
          )}>
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-200"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className={cn(
          "p-6 overflow-y-auto",
          contentClassName
        )}>
          {children}
        </div>
      </div>
    </div>
  )
}

// Footer component for modal actions
const ModalFooter = ({ children, className = '' }) => {
  return (
    <div className={cn(
      "flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50",
      className
    )}>
      {children}
    </div>
  )
}

// Form wrapper component for modals
const ModalForm = ({ onSubmit, children, className = '' }) => {
  return (
    <form 
      onSubmit={onSubmit}
      className={cn("flex flex-col h-full", className)}
    >
      {children}
    </form>
  )
}

export { Modal, ModalFooter, ModalForm }
export default Modal