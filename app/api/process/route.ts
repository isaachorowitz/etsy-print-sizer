import { NextRequest, NextResponse } from 'next/server'
import formidable from 'formidable'
import { promises as fs } from 'fs'
import path from 'path'
import { loadAndProcessImage, getImageDimensions } from '@/lib/image'
import { upscaleToLargestMaster } from '@/lib/upscale'
import { cropForAllAspects, CropResult } from '@/lib/crop'
import { getLargestMasterArea, getMasterDimensions, getAllSizes, AspectRatio, MASTER_SIZES_300DPI, formatSizeLabel, formatPixelDimensions } from '@/lib/sizes'
import { StreamingZip, formatFilename, createDirectoryPath } from '@/lib/zip'

// Disable Next.js body parsing for this route
export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null

  try {
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const everySizes = formData.get('everySizes') === 'true'
    const include5x7 = formData.get('include5x7') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Convert File to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Get original filename for basename
    const basename = file.name.replace(/\.[^/.]+$/, '')

    console.log(`🎯 Processing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

    // Step 1: Load and process the original image
    console.log('📋 Step 1: Validating and loading image...')
    const processedImage = await loadAndProcessImage(buffer)
    const originalDimensions = await getImageDimensions(buffer)
    console.log(`✅ Original dimensions: ${originalDimensions.width}x${originalDimensions.height}px`)

    // Step 2: Determine largest master size needed
    console.log('📐 Step 2: Analyzing dimensions and planning upscaling...')
    const largestMaster = getLargestMasterArea()
    console.log(`🎯 Target largest master: ${largestMaster.width}x${largestMaster.height}px (24×36 inches at 300 DPI)`)

    // Step 3: Upscale to largest master size using Sharp
    console.log('⚡ Step 3: Upscaling with Sharp Lanczos3 algorithm...')
    const upscaledResult = await upscaleToLargestMaster(buffer, largestMaster)
    console.log(`✅ Upscaled to: ${upscaledResult.width}x${upscaledResult.height}px using Sharp Lanczos3`)

    // Step 4: Determine aspect ratios to process
    const aspectRatios: AspectRatio[] = ['2x3', '3x4', '4x5', '11x14', 'ISO']
    if (include5x7) {
      aspectRatios.push('5x7')
    }

    // Step 5: Create target dimensions for each aspect ratio
    const targetDimensions: Record<AspectRatio, [number, number]> = {
      '2x3': [0, 0],
      '3x4': [0, 0],
      '4x5': [0, 0],
      '11x14': [0, 0],
      'ISO': [0, 0],
      '5x7': [0, 0],
    }

    aspectRatios.forEach(ratio => {
      targetDimensions[ratio] = getMasterDimensions(ratio)
    })

    // Step 4: Crop for all aspect ratios from upscaled image
    console.log('✂️ Step 4: Creating smart crops for all aspect ratios...')
    const cropResults = await cropForAllAspects(
      upscaledResult.buffer,
      aspectRatios,
      targetDimensions
    )
    console.log(`✅ Created ${aspectRatios.length} smart crops for aspect ratios: ${aspectRatios.join(', ')}`)

    // Step 5: Create ZIP stream
    console.log('📦 Step 5: Creating ZIP package with organized structure...')
    const zip = new StreamingZip()
    const zipStream = zip.getStream()

    // Set response headers for streaming ZIP
    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', 'application/zip')
    responseHeaders.set('Content-Disposition', `attachment; filename="${basename}_Etsy_Print_Kit.zip"`)

    // Start streaming the ZIP
    const responseStream = new ReadableStream({
      start(controller) {
        zipStream.on('data', (chunk) => {
          controller.enqueue(chunk)
        })

        zipStream.on('end', () => {
          controller.close()
        })

        zipStream.on('error', (error) => {
          console.error('ZIP stream error:', error)
          controller.error(error)
        })
      }
    })

    // Step 6: Add all cropped images to ZIP
    console.log('🖼️ Step 6: Generating all print sizes and adding to ZIP...')
    const addImagesToZip = async () => {
      for (const aspectRatio of aspectRatios) {
        const cropResult = cropResults[aspectRatio]
        const masterSize = MASTER_SIZES_300DPI[aspectRatio]
        const masterLabel = formatSizeLabel(aspectRatio, masterSize)

        // Add master size
        const masterFilename = formatFilename(basename, aspectRatio, masterLabel)
        const masterPath = `${createDirectoryPath(aspectRatio)}/${masterFilename}`

        await zip.addBuffer(cropResult.buffer, masterPath)

        // Add sub-sizes if requested
        if (everySizes) {
          const allSizes = getAllSizes(aspectRatio, true)
          const subSizes = allSizes.filter(size => size.type === 'sub')

          for (const subSize of subSizes) {
            // For sub-sizes, we need to crop from the master crop
            // This is a simplified approach - in production, you'd want to
            // crop each sub-size from the original upscaled image for better quality
            const subTargetDimensions: Record<AspectRatio, [number, number]> = {
              '2x3': [0, 0],
              '3x4': [0, 0],
              '4x5': [0, 0],
              '11x14': [0, 0],
              'ISO': [0, 0],
              '5x7': [0, 0],
            }
            subTargetDimensions[aspectRatio] = [Math.round(subSize.dimensions[0] * 300), Math.round(subSize.dimensions[1] * 300)]

            const subCropResult = await cropForAllAspects(
              cropResult.buffer,
              [aspectRatio],
              subTargetDimensions
            )

            const subFilename = formatFilename(basename, aspectRatio, subSize.label)
            const subPath = `${createDirectoryPath(aspectRatio)}/${subFilename}`

            await zip.addBuffer(subCropResult[aspectRatio].buffer, subPath)
          }
        }
      }

      // Add manifest
      const manifestContent = generateManifest(basename, aspectRatios, everySizes, include5x7, originalDimensions, cropResults)
      await zip.addBuffer(Buffer.from(manifestContent, 'utf-8'), 'manifest.txt')

      // Finalize ZIP
      console.log('✅ All images processed and added to ZIP')
      console.log('🎁 Finalizing ZIP package for download...')
      zip.finalize()
    }

    // Start adding images to ZIP in the background
    addImagesToZip().catch(error => {
      console.error('Error adding images to ZIP:', error)
      zipStream.emit('error', error)
    })

    return new NextResponse(responseStream, {
      status: 200,
      headers: responseHeaders,
    })

  } catch (error) {
    console.error('Processing error:', error)

    // Clean up temp file if it exists
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath)
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError)
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateManifest(
  basename: string,
  aspectRatios: AspectRatio[],
  everySizes: boolean,
  include5x7: boolean,
  originalDimensions: { width: number; height: number },
  cropResults: Record<AspectRatio, CropResult>
): string {
  const lines = [
    'Etsy Print Sizer - Generated Images',
    `Source file: ${basename}`,
    `Original dimensions: ${originalDimensions.width}x${originalDimensions.height}px`,
    `Generated at: ${new Date().toISOString()}`,
    `DPI: 300`,
    '',
    'Included aspect ratios:',
  ]

  aspectRatios.forEach(ratio => {
    const cropResult = cropResults[ratio]
    const masterSize = MASTER_SIZES_300DPI[ratio]
    const masterLabel = formatSizeLabel(ratio, masterSize)
    lines.push(`  - ${ratio}: ${masterLabel} (${formatPixelDimensions([cropResult.width, cropResult.height])})`)
  })

  if (everySizes) {
    lines.push('')
    lines.push('Every size mode: ENABLED')
    lines.push('All sub-sizes for each aspect ratio included')
  } else {
    lines.push('')
    lines.push('Every size mode: DISABLED')
    lines.push('Only master sizes included')
  }

  lines.push('')
  lines.push('Processing details:')
  lines.push('- Images converted to sRGB color space')
  lines.push('- EXIF orientation automatically corrected')
  lines.push('- Alpha channels flattened to white background')
  lines.push('- Sharp Lanczos3 upscaling algorithm (high quality, reliable)')
  lines.push('- JPEG quality: 95% with 4:4:4 chroma subsampling')
  lines.push('- Smart cropping with face/salient region detection')
  lines.push('- 300 DPI metadata applied to all images')
  lines.push('- sRGB color profile embedded for consistent colors')

  lines.push('')
  lines.push('Notes:')
  lines.push('- 22×30 cm is slightly off true 3:4 ratio')
  lines.push('- Print labs may trim a few mm if needed for exact sizes')

  return lines.join('\n')
}
