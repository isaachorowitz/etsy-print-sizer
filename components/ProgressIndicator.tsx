'use client'

import { CheckCircle, Clock, Loader2, Zap, Image, Download, Scissors, Grid3X3 } from 'lucide-react'

interface ProcessingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  status: 'pending' | 'active' | 'completed'
  substeps?: string[]
  currentSubstep?: number
}

interface ProgressIndicatorProps {
  progress: number
  status: string
  currentStep?: string
  currentSubstep?: string
  totalSteps?: number
  completedSteps?: number
}

export function ProgressIndicator({ 
  progress, 
  status, 
  currentStep,
  currentSubstep,
  totalSteps = 6,
  completedSteps = 0
}: ProgressIndicatorProps) {
  
  const getSteps = (): ProcessingStep[] => {
    const steps: ProcessingStep[] = [
      {
        id: 'validation',
        title: 'Image Validation',
        description: 'Checking file format, size, and dimensions',
        icon: Image,
        status: 'pending',
        substeps: [
          'Validating file format (JPG, PNG, GIF)',
          'Checking file size (max 50MB)',
          'Reading image metadata and EXIF data',
          'Verifying image integrity'
        ]
      },
      {
        id: 'analysis',
        title: 'Dimension Analysis',
        description: 'Analyzing current size and calculating upscaling needs',
        icon: Zap,
        status: 'pending',
        substeps: [
          'Measuring current image dimensions',
          'Calculating largest required master size',
          'Determining upscaling factor needed',
          'Planning processing strategy'
        ]
      },
      {
        id: 'upscaling',
        title: 'Sharp Upscaling',
        description: 'Enhancing image quality with Lanczos3 algorithm',
        icon: Loader2,
        status: 'pending',
        substeps: [
          'Converting to sRGB color space',
          'Removing alpha channel (flatten to white)',
          'Applying Sharp Lanczos3 upscaling',
          'Optimizing image quality settings'
        ]
      },
      {
        id: 'cropping',
        title: 'Smart Cropping',
        description: 'Creating optimized crops for each aspect ratio',
        icon: Scissors,
        status: 'pending',
        substeps: [
          'Analyzing image content for smart cropping',
          'Cropping for 2:3 aspect ratio (24×36in)',
          'Cropping for 3:4 aspect ratio (18×24in)',
          'Cropping for 4:5 aspect ratio (20×25in)',
          'Cropping for 11:14 aspect ratio (22×28in)',
          'Cropping for ISO A1 aspect ratio (23.39×33.11in)'
        ]
      },
      {
        id: 'generation',
        title: 'Size Generation',
        description: 'Creating all print formats at 300 DPI',
        icon: Grid3X3,
        status: 'pending',
        substeps: [
          'Generating master sizes for each aspect ratio',
          'Creating sub-sizes (if requested)',
          'Applying 300 DPI metadata',
          'Optimizing JPEG quality (95%, 4:4:4 chroma)',
          'Adding color profile information'
        ]
      },
      {
        id: 'packaging',
        title: 'ZIP Creation',
        description: 'Organizing files and creating download package',
        icon: Download,
        status: 'pending',
        substeps: [
          'Creating organized folder structure',
          'Adding files to ZIP archive',
          'Generating processing manifest',
          'Compressing with maximum settings',
          'Finalizing download package'
        ]
      }
    ]

    // Determine current step based on status
    let currentStepIndex = 0
    const statusLower = status.toLowerCase()
    
    if (statusLower.includes('validat') || statusLower.includes('check')) currentStepIndex = 0
    else if (statusLower.includes('analy') || statusLower.includes('dimension')) currentStepIndex = 1
    else if (statusLower.includes('upscal') || statusLower.includes('sharp') || statusLower.includes('lanczos')) currentStepIndex = 2
    else if (statusLower.includes('crop') || statusLower.includes('aspect')) currentStepIndex = 3
    else if (statusLower.includes('generat') || statusLower.includes('size') || statusLower.includes('dpi')) currentStepIndex = 4
    else if (statusLower.includes('zip') || statusLower.includes('packag') || statusLower.includes('download')) currentStepIndex = 5

    // Update step statuses
    return steps.map((step, index) => {
      let stepStatus: 'pending' | 'active' | 'completed' = 'pending'
      let currentSubstepIndex = 0
      
      if (index < currentStepIndex) {
        stepStatus = 'completed'
      } else if (index === currentStepIndex) {
        stepStatus = 'active'
        // Calculate substep based on progress within the current step
        const stepProgress = ((progress - (index * 16.67)) / 16.67) * 100
        currentSubstepIndex = Math.floor((stepProgress / 100) * (step.substeps?.length || 1))
      }
      
      return {
        ...step,
        status: stepStatus,
        currentSubstep: stepStatus === 'active' ? Math.max(0, Math.min(currentSubstepIndex, (step.substeps?.length || 1) - 1)) : undefined
      }
    })
  }

  const steps = getSteps()
  const activeStep = steps.find(step => step.status === 'active')
  const completedCount = steps.filter(step => step.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Overall Progress Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-lg font-semibold text-gray-800">Processing Your Image</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Step {completedCount + 1} of {steps.length}</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        
        {/* Main Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Current Status */}
      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-800 font-medium">{status}</p>
        {activeStep && activeStep.currentSubstep !== undefined && activeStep.substeps && (
          <p className="text-blue-600 text-sm mt-1">
            → {activeStep.substeps[activeStep.currentSubstep]}
          </p>
        )}
      </div>

      {/* Detailed Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = step.status === 'active'
          const isCompleted = step.status === 'completed'

          return (
            <div
              key={step.id}
              className={`flex items-start space-x-4 p-4 rounded-lg border transition-all duration-300 ${
                isCompleted 
                  ? 'bg-green-50 border-green-200' 
                  : isActive 
                    ? 'bg-blue-50 border-blue-200 shadow-sm' 
                    : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : isActive ? (
                  <Icon className={`w-6 h-6 text-blue-600 ${step.icon === Loader2 ? 'animate-spin' : ''}`} />
                ) : (
                  <Icon className="w-6 h-6 text-gray-400" />
                )}
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-semibold ${
                    isCompleted ? 'text-green-800' : 
                    isActive ? 'text-blue-800' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </h4>
                  
                  {isActive && (
                    <span className="text-sm font-medium text-blue-600">
                      {step.currentSubstep !== undefined && step.substeps ? 
                        `${step.currentSubstep + 1}/${step.substeps.length}` : 
                        'Processing...'
                      }
                    </span>
                  )}
                </div>
                
                <p className={`text-sm mb-2 ${
                  isCompleted ? 'text-green-600' : 
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.description}
                </p>

                {/* Substeps for active step */}
                {isActive && step.substeps && (
                  <div className="space-y-1 mt-3">
                    {step.substeps.map((substep, substepIndex) => (
                      <div 
                        key={substepIndex}
                        className={`text-xs flex items-center space-x-2 ${
                          substepIndex < (step.currentSubstep || 0) ? 'text-green-600' :
                          substepIndex === (step.currentSubstep || 0) ? 'text-blue-600 font-medium' :
                          'text-gray-400'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          substepIndex < (step.currentSubstep || 0) ? 'bg-green-500' :
                          substepIndex === (step.currentSubstep || 0) ? 'bg-blue-500' :
                          'bg-gray-300'
                        }`}></div>
                        <span>{substep}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Completed substeps summary */}
                {isCompleted && step.substeps && (
                  <div className="text-xs text-green-600 mt-2">
                    ✓ Completed all {step.substeps.length} substeps
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}