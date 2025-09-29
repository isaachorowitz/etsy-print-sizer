'use client'

interface ProgressIndicatorProps {
  progress: number
  status: string
}

export function ProgressIndicator({ progress, status }: ProgressIndicatorProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Progress</span>
        <span className="font-medium">{progress}%</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <p className="text-sm text-gray-600 text-center">{status}</p>
    </div>
  )
}
