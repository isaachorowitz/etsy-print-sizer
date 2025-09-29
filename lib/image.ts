import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'

const ICC_PROFILE_PATH = path.join(process.cwd(), 'public/icc/sRGB.icc')

export interface ProcessedImage {
  buffer: Buffer
  width: number
  height: number
  format: string
  hasAlpha: boolean
}

export async function loadAndProcessImage(inputBuffer: Buffer): Promise<sharp.Sharp> {
  let pipeline = sharp(inputBuffer)

  // Get metadata to check format and orientation
  const metadata = await pipeline.metadata()

  // Rotate based on EXIF orientation
  if (metadata.orientation && metadata.orientation !== 1) {
    pipeline = pipeline.rotate()
  }

  // Convert to sRGB color space
  try {
    // Try to load ICC profile if available
    const iccBuffer = await fs.readFile(ICC_PROFILE_PATH).catch(() => null)

    if (iccBuffer) {
      // Use the sRGB ICC profile for consistent color output
      pipeline = pipeline.withMetadata({
        icc: iccBuffer.toString('base64'),
      })
    }
  } catch (error) {
    console.warn('Could not load ICC profile, proceeding without:', error)
  }

  // Convert to sRGB if not already
  pipeline = pipeline.toColorspace('srgb')

  // Remove alpha channel for JPEG output (flatten to white background)
  if (metadata.hasAlpha) {
    pipeline = pipeline.flatten({ background: '#ffffff' })
  }

  return pipeline
}

export async function saveJpeg(
  pipeline: sharp.Sharp,
  outputPath?: string,
  options: {
    quality?: number
    dpi?: number
    progressive?: boolean
  } = {}
): Promise<Buffer> {
  const {
    quality = 95,
    dpi = 300,
    progressive = true,
  } = options

  let jpegPipeline = pipeline.jpeg({
    quality,
    chromaSubsampling: '4:4:4',
    mozjpeg: true,
    progressive,
  })

  // Try to set DPI metadata (note: this may not work reliably across all systems)
  try {
    // Sharp doesn't directly support setting DPI in JFIF,
    // but we can try with withMetadata
    jpegPipeline = jpegPipeline.withMetadata({
      density: dpi,
    })
  } catch (error) {
    console.warn('Could not set DPI metadata:', error)
  }

  if (outputPath) {
    await jpegPipeline.toFile(outputPath)
    return Buffer.from('') // Return empty buffer if writing to file
  } else {
    return await jpegPipeline.toBuffer()
  }
}

export async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  const metadata = await sharp(buffer).metadata()
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  }
}

export async function convertToJpeg(buffer: Buffer): Promise<Buffer> {
  const pipeline = await loadAndProcessImage(buffer)
  return saveJpeg(pipeline)
}

export async function resizeImage(
  buffer: Buffer,
  width: number,
  height: number,
  options: {
    fit?: keyof sharp.FitEnum
    kernel?: keyof sharp.KernelEnum
  } = {}
): Promise<Buffer> {
  const {
    fit = 'inside',
    kernel = 'lanczos3',
  } = options

  const pipeline = await loadAndProcessImage(buffer)
  return pipeline
    .resize(width, height, { fit, kernel })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toBuffer()
}

export async function ensureMinimumSize(
  buffer: Buffer,
  minWidth: number,
  minHeight: number
): Promise<Buffer> {
  const { width, height } = await getImageDimensions(buffer)

  if (width >= minWidth && height >= minHeight) {
    return buffer
  }

  return resizeImage(buffer, Math.max(width, minWidth), Math.max(height, minHeight))
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase().slice(1)
}

export function getBasename(filename: string): string {
  return path.basename(filename, path.extname(filename))
}
