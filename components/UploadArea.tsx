'use client'

import { useCallback, useState } from 'react'
import { Upload, X } from 'lucide-react'

interface UploadAreaProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  disabled?: boolean
}

export function UploadArea({ onFileSelect, selectedFile, disabled }: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))

    if (imageFile && !disabled) {
      onFileSelect(imageFile)
    }
  }, [onFileSelect, disabled])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && !disabled) {
      onFileSelect(file)
    }
  }, [onFileSelect, disabled])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
          id="file-upload"
        />

        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="max-h-32 max-w-32 object-cover rounded"
              />
            </div>
            <div>
              <p className="text-sm text-gray-600">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              onClick={() => onFileSelect(null as any)}
              disabled={disabled}
              className="text-red-500 hover:text-red-700 text-sm flex items-center space-x-1 mx-auto"
            >
              <X size={16} />
              <span>Remove</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload size={48} className="mx-auto text-gray-400" />
            <div>
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-700 font-medium">
                  Click to upload
                </span>
                <span className="text-gray-500"> or drag and drop</span>
              </label>
              <p className="text-sm text-gray-500 mt-2">
                PNG, JPG, GIF up to 50MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
