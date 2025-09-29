import sharp from 'sharp'
import Replicate from 'replicate'

// Real-ESRGAN model on Replicate
const REPLICATE_MODEL = 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738f6d7c'

export interface UpscaleResult {
  buffer: Buffer
  width: number
  height: number
  upscaled: boolean
}

export async function upscaleImage(
  inputBuffer: Buffer,
  targetWidth: number,
  targetHeight: number
): Promise<UpscaleResult> {
  const originalMetadata = await sharp(inputBuffer).metadata()
  const { width: originalWidth = 0, height: originalHeight = 0 } = originalMetadata

  // Check if upscaling is needed
  const needsUpscaling = originalWidth < targetWidth || originalHeight < targetHeight

  if (!needsUpscaling) {
    // No upscaling needed, just resize to target dimensions
    const resizedBuffer = await sharp(inputBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'inside',
        kernel: 'lanczos3',
      })
      .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
      .toBuffer()

    return {
      buffer: resizedBuffer,
      width: targetWidth,
      height: targetHeight,
      upscaled: false,
    }
  }

  // Force Sharp Lanczos upscaling only (AI disabled for reliability)
  console.log('Using Sharp Lanczos upscaling (AI disabled)')
  return await sharpUpscale(inputBuffer, targetWidth, targetHeight)
}

async function aiUpscale(
  inputBuffer: Buffer,
  targetWidth: number,
  targetHeight: number
): Promise<UpscaleResult> {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  })

  // Convert buffer to base64 for Replicate
  const base64Image = inputBuffer.toString('base64')

  // Calculate upscale factor (max 4x from Real-ESRGAN)
  const originalMetadata = await sharp(inputBuffer).metadata()
  const { width: originalWidth = 0, height: originalHeight = 0 } = originalMetadata

  const scaleFactor = Math.min(4, Math.max(
    Math.ceil(targetWidth / originalWidth),
    Math.ceil(targetHeight / originalHeight)
  ))

  console.log(`Using Real-ESRGAN x${scaleFactor} upscaling`)

  // Use Real-ESRGAN for upscaling
  const prediction = await replicate.predictions.create({
    version: "42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738f6d7c",
    input: {
      image: `data:image/jpeg;base64,${base64Image}`,
      scale: scaleFactor,
    },
  })

  // Wait for completion
  let result = prediction
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(resolve => setTimeout(resolve, 1000))
    result = await replicate.predictions.get(prediction.id)
  }

  if (result.status === 'failed') {
    throw new Error('Real-ESRGAN upscaling failed')
  }

  // Get the upscaled image URL and download it
  const upscaledImageUrl = result.output as string
  const response = await fetch(upscaledImageUrl)

  if (!response.ok) {
    throw new Error('Failed to download upscaled image')
  }

  const arrayBuffer = await response.arrayBuffer()
  const upscaledBuffer = Buffer.from(arrayBuffer) as Buffer
  const upscaledMetadata = await sharp(upscaledBuffer).metadata()
  const { width: upscaledWidth = 0, height: upscaledHeight = 0 } = upscaledMetadata

  // If still smaller than target, do final resize with Sharp
  let finalBuffer = upscaledBuffer
  let finalWidth = upscaledWidth
  let finalHeight = upscaledHeight

  if (upscaledWidth < targetWidth || upscaledHeight < targetHeight) {
    console.log('Final resize needed after AI upscaling')

    finalBuffer = await sharp(upscaledBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'inside',
        kernel: 'lanczos3',
      })
      .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
      .toBuffer()

    finalWidth = targetWidth
    finalHeight = targetHeight
  }

  return {
    buffer: finalBuffer,
    width: finalWidth,
    height: finalHeight,
    upscaled: true,
  }
}

async function sharpUpscale(
  inputBuffer: Buffer,
  targetWidth: number,
  targetHeight: number
): Promise<UpscaleResult> {
  console.log('Using Sharp Lanczos upscaling')

  const originalMetadata = await sharp(inputBuffer).metadata()
  const { width: originalWidth = 0, height: originalHeight = 0 } = originalMetadata

  // Calculate upscale factor
  const widthScale = targetWidth / originalWidth
  const heightScale = targetHeight / originalHeight
  const scaleFactor = Math.max(widthScale, heightScale)

  // For very large upscaling, do it in stages to maintain quality
  let currentBuffer = inputBuffer
  let currentWidth = originalWidth
  let currentHeight = originalHeight

  if (scaleFactor > 2) {
    // Stage 1: Upscale to 2x intermediate size
    const intermediateWidth = Math.round(originalWidth * 2)
    const intermediateHeight = Math.round(originalHeight * 2)

    currentBuffer = await sharp(inputBuffer)
      .resize(intermediateWidth, intermediateHeight, {
        kernel: 'lanczos3',
        fit: 'inside',
      })
      .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
      .toBuffer()

    currentWidth = intermediateWidth
    currentHeight = intermediateHeight
  }

  // Stage 2: Final resize to target dimensions
  const finalBuffer = await sharp(currentBuffer)
    .resize(targetWidth, targetHeight, {
      fit: 'inside',
      kernel: 'lanczos3',
    })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toBuffer()

  return {
    buffer: finalBuffer,
    width: targetWidth,
    height: targetHeight,
    upscaled: true,
  }
}

export async function upscaleToLargestMaster(
  inputBuffer: Buffer,
  largestDimensions: { width: number; height: number }
): Promise<UpscaleResult> {
  return upscaleImage(inputBuffer, largestDimensions.width, largestDimensions.height)
}
