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
    setStatus('Starting image processing...')
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('everySizes', options.everySizes.toString())
      formData.append('include5x7', options.include5x7.toString())

      // Detailed progress simulation that matches our progress indicator
      const progressSteps = [
        // Step 1: Validation (0-16%)
        { progress: 2, status: 'Validating file format and checking size limits...', delay: 500 },
        { progress: 6, status: 'Reading image metadata and EXIF orientation...', delay: 300 },
        { progress: 12, status: 'Verifying image integrity and format compatibility...', delay: 400 },
        { progress: 16, status: 'Image validation completed successfully', delay: 200 },
        
        // Step 2: Analysis (17-33%)
        { progress: 20, status: 'Analyzing current image dimensions...', delay: 300 },
        { progress: 25, status: 'Calculating largest required master size (24×36 inches)...', delay: 400 },
        { progress: 30, status: 'Determining optimal upscaling strategy...', delay: 300 },
        { progress: 33, status: 'Planning processing workflow for multiple aspect ratios', delay: 200 },
        
        // Step 3: Upscaling (34-50%)
        { progress: 36, status: 'Converting image to sRGB color space...', delay: 600 },
        { progress: 40, status: 'Flattening alpha channel to white background...', delay: 400 },
        { progress: 45, status: 'Applying Sharp Lanczos3 upscaling algorithm...', delay: 1200 },
        { progress: 50, status: 'Optimizing upscaled image quality and metadata', delay: 400 },
        
        // Step 4: Cropping (51-67%)
        { progress: 53, status: 'Analyzing image content for intelligent cropping...', delay: 500 },
        { progress: 57, status: 'Creating smart crop for 2:3 aspect ratio (24×36in)...', delay: 400 },
        { progress: 60, status: 'Creating smart crop for 3:4 aspect ratio (18×24in)...', delay: 400 },
        { progress: 63, status: 'Creating smart crop for 4:5 aspect ratio (20×25in)...', delay: 400 },
        { progress: 66, status: 'Creating smart crop for 11:14 aspect ratio (22×28in)...', delay: 400 },
        { progress: 67, status: 'Creating smart crop for ISO A1 aspect ratio (23.39×33.11in)', delay: 300 },
        
        // Step 5: Generation (68-84%)
        { progress: 70, status: 'Generating master size images at 300 DPI...', delay: 600 },
        { progress: 75, status: options.everySizes ? 'Creating additional sub-sizes for each aspect ratio...' : 'Finalizing master size generation...', delay: options.everySizes ? 1000 : 300 },
        { progress: 80, status: 'Applying 300 DPI metadata to all images...', delay: 400 },
        { progress: 83, status: 'Optimizing JPEG quality (95%, 4:4:4 chroma subsampling)...', delay: 500 },
        { progress: 84, status: 'Adding sRGB color profile information to images', delay: 200 },
        
        // Step 6: Packaging (85-100%)
        { progress: 87, status: 'Creating organized folder structure...', delay: 300 },
        { progress: 92, status: 'Adding all processed images to ZIP archive...', delay: 600 },
        { progress: 96, status: 'Generating detailed processing manifest...', delay: 300 },
        { progress: 98, status: 'Compressing ZIP with maximum settings...', delay: 400 },
        { progress: 99, status: 'Finalizing download package...', delay: 200 }
      ]

      // Execute progress steps
      let stepIndex = 0
      const executeNextStep = () => {
        if (stepIndex < progressSteps.length) {
          const step = progressSteps[stepIndex]
          setProgress(step.progress)
          setStatus(step.status)
          stepIndex++
          setTimeout(executeNextStep, step.delay)
        }
      }

      // Start progress simulation
      executeNextStep()

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Final steps
      setProgress(99.5)
      setStatus('Preparing download...')

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
      setStatus('✅ Complete! Your print-ready files have been downloaded.')

      // Auto-clear status after success
      setTimeout(() => {
        setProgress(0)
        setStatus('')
      }, 4000)

    } catch (err) {
      console.error('Processing error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during processing')
      setProgress(0)
      setStatus('')
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
