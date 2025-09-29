'use client'

import { useState, useCallback } from 'react'
import { UploadArea } from '@/components/UploadArea'
import { OptionsPanel } from '@/components/OptionsPanel'
import { ProgressIndicator } from '@/components/ProgressIndicator'
import { ProcessingStatus } from '@/components/ProcessingStatus'

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [options, setOptions] = useState({
    everySizes: false,
    include5x7: false,
  })

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    setError('')
  }, [])

  const handleProcess = useCallback(async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setProgress(0)
    setStatus('Preparing...')
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('everySizes', options.everySizes.toString())
      formData.append('include5x7', options.include5x7.toString())

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setStatus('Processing images...')
      setProgress(25)

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_Etsy_Print_Kit.zip`

      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setProgress(100)
      setStatus('Complete! Download started.')

    } catch (err) {
      console.error('Processing error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during processing')
    } finally {
      setIsProcessing(false)
    }
  }, [selectedFile, options])

  return (
    <main className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <UploadArea
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          disabled={isProcessing}
        />

        {selectedFile && (
          <div className="mt-8 space-y-6">
            <OptionsPanel
              options={options}
              onChange={setOptions}
              disabled={isProcessing}
            />

            <div className="flex justify-center">
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Process & Download ZIP</span>
                  </>
                )}
              </button>
            </div>

            {isProcessing && (
              <ProgressIndicator progress={progress} status={status} />
            )}

            <ProcessingStatus status={status} error={error} />
          </div>
        )}
      </div>
    </main>
  )
}
