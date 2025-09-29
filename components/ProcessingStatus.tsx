'use client'

import { CheckCircle, AlertCircle } from 'lucide-react'

interface ProcessingStatusProps {
  status: string
  error: string
}

export function ProcessingStatus({ status, error }: ProcessingStatusProps) {
  if (error) {
    return (
      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
        <AlertCircle size={20} />
        <span className="text-sm">{error}</span>
      </div>
    )
  }

  if (status && !status.includes('Complete')) {
    return (
      <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 p-3 rounded-md">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm">{status}</span>
      </div>
    )
  }

  if (status.includes('Complete')) {
    return (
      <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-md">
        <CheckCircle size={20} />
        <span className="text-sm">{status}</span>
      </div>
    )
  }

  return null
}
