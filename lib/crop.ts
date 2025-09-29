import sharp from 'sharp'
import smartcrop from 'smartcrop-sharp'
import { AspectRatio, ASPECT_RATIOS } from './sizes'

export interface CropResult {
  buffer: Buffer
  width: number
  height: number
  cropX: number
  cropY: number
  cropWidth: number
  cropHeight: number
}

export async function smartCropToAspect(
  inputBuffer: Buffer,
  aspectRatio: AspectRatio,
  targetWidth: number,
  targetHeight: number
): Promise<CropResult> {
  try {
    const aspect = ASPECT_RATIOS[aspectRatio]

    // Use smartcrop-sharp to find the best crop area
    const smartCropResult = await smartcrop.crop(inputBuffer, {
      width: targetWidth,
      height: targetHeight,
    })

    if (smartCropResult.topCrop) {
      const { x, y, width, height } = smartCropResult.topCrop

      // Use sharp to extract the crop
      const croppedBuffer = await sharp(inputBuffer)
        .extract({
          left: Math.round(x),
          top: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
        })
        .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
        .toBuffer()

      return {
        buffer: croppedBuffer,
        width: Math.round(width),
        height: Math.round(height),
        cropX: Math.round(x),
        cropY: Math.round(y),
        cropWidth: Math.round(width),
        cropHeight: Math.round(height),
      }
    }
  } catch (error) {
    console.warn('Smart crop failed, falling back to center crop:', error)
  }

  // Fallback to center crop
  return centerCropToAspect(inputBuffer, aspectRatio, targetWidth, targetHeight)
}

export async function centerCropToAspect(
  inputBuffer: Buffer,
  aspectRatio: AspectRatio,
  targetWidth: number,
  targetHeight: number
): Promise<CropResult> {
  const aspect = ASPECT_RATIOS[aspectRatio]

  // Get original image dimensions
  const metadata = sharp(inputBuffer).metadata()
  return metadata.then(meta => {
    const { width: origWidth = 0, height: origHeight = 0 } = meta

    // Calculate crop dimensions maintaining aspect ratio
    const targetAspect = targetWidth / targetHeight
    const origAspect = origWidth / origHeight

    let cropWidth: number
    let cropHeight: number
    let cropX: number
    let cropY: number

    if (origAspect > targetAspect) {
      // Original is wider, crop width
      cropHeight = origHeight
      cropWidth = Math.round(origHeight * targetAspect)
      cropX = Math.round((origWidth - cropWidth) / 2)
      cropY = 0
    } else {
      // Original is taller, crop height
      cropWidth = origWidth
      cropHeight = Math.round(origWidth / targetAspect)
      cropX = 0
      cropY = Math.round((origHeight - cropHeight) / 2)
    }

    // Ensure crop doesn't exceed original dimensions
    cropWidth = Math.min(cropWidth, origWidth)
    cropHeight = Math.min(cropHeight, origHeight)
    cropX = Math.max(0, Math.min(cropX, origWidth - cropWidth))
    cropY = Math.max(0, Math.min(cropY, origHeight - cropHeight))

    // Extract and resize to target dimensions
    const croppedBuffer = sharp(inputBuffer)
      .extract({
        left: cropX,
        top: cropY,
        width: cropWidth,
        height: cropHeight,
      })
      .resize(targetWidth, targetHeight, {
        fit: 'fill',
        kernel: 'lanczos3',
      })
      .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
      .toBuffer()

    return croppedBuffer.then(buffer => ({
      buffer,
      width: targetWidth,
      height: targetHeight,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
    }))
  })
}

export async function cropToAspectRatio(
  inputBuffer: Buffer,
  aspectRatio: AspectRatio,
  targetWidth: number,
  targetHeight: number
): Promise<CropResult> {
  return smartCropToAspect(inputBuffer, aspectRatio, targetWidth, targetHeight)
}

export async function cropForAllAspects(
  inputBuffer: Buffer,
  aspectRatios: AspectRatio[],
  targetDimensions: Record<AspectRatio, [number, number]>
): Promise<Record<AspectRatio, CropResult>> {
  const results: Partial<Record<AspectRatio, CropResult>> = {}

  // Process all crops in parallel for better performance
  const cropPromises = aspectRatios.map(async (aspectRatio) => {
    const [width, height] = targetDimensions[aspectRatio]
    const result = await cropToAspectRatio(inputBuffer, aspectRatio, width, height)
    return { aspectRatio, result }
  })

  const cropResults = await Promise.all(cropPromises)

  for (const { aspectRatio, result } of cropResults) {
    results[aspectRatio] = result
  }

  return results as Record<AspectRatio, CropResult>
}
