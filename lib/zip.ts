import archiver from 'archiver'
import { Writable } from 'stream'
import { AspectRatio, MASTER_SIZES_300DPI, getAllSizes, formatSizeLabel, formatPixelDimensions } from './sizes'

export interface ZipFile {
  name: string
  buffer: Buffer
}

export interface ZipOptions {
  basename: string
  includeEverySize: boolean
  include5x7: boolean
}

export class StreamingZip {
  private archive: archiver.Archiver
  private files: ZipFile[] = []
  private manifestLines: string[] = []

  constructor() {
    this.archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    })

    // Handle archive warnings and errors
    this.archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archive warning:', err)
      } else {
        throw err
      }
    })

    this.archive.on('error', (err) => {
      throw err
    })
  }

  getStream(): Writable {
    return this.archive
  }

  async addBuffer(buffer: Buffer, filename: string): Promise<void> {
    this.archive.append(buffer, { name: filename })
    this.files.push({ name: filename, buffer })
  }

  async addDirectoryStructure(options: ZipOptions): Promise<void> {
    const { basename, includeEverySize, include5x7 } = options

    // Determine which aspect ratios to include
    const aspectRatios: AspectRatio[] = ['2x3', '3x4', '4x5', '11x14', 'ISO']
    if (include5x7) {
      aspectRatios.push('5x7')
    }

    // Create directory structure and collect files
    const allFiles: Array<{ path: string; buffer: Buffer }> = []

    for (const aspectRatio of aspectRatios) {
      const sizes = getAllSizes(aspectRatio, includeEverySize)
      const masterSize = MASTER_SIZES_300DPI[aspectRatio]
      const masterLabel = formatSizeLabel(aspectRatio, masterSize)

      // Add master size
      const masterFilename = `${basename}_${aspectRatio}_${masterLabel}_300dpi.jpg`
      const masterPath = `${aspectRatio}/${masterFilename}`

      // Add manifest entry for master
      this.manifestLines.push(`${aspectRatio} master: ${masterLabel} (${formatPixelDimensions([0, 0])})`) // Will update pixel dimensions later

      // Add sub-sizes if requested
      if (includeEverySize) {
        sizes.filter(size => size.type === 'sub').forEach(size => {
          const subFilename = `${basename}_${aspectRatio}_${size.label}_300dpi.jpg`
          const subPath = `${aspectRatio}/${subFilename}`
          // Note: In a real implementation, we'd have the actual buffers here
          // For now, we'll add placeholder entries
        })
      }
    }

    // Add manifest file
    const manifestContent = this.generateManifest(options)
    await this.addBuffer(Buffer.from(manifestContent, 'utf-8'), 'manifest.txt')
  }

  private generateManifest(options: ZipOptions): string {
    const { basename, includeEverySize, include5x7 } = options

    const lines = [
      'Etsy Print Sizer - Generated Images',
      `Source file: ${basename}`,
      `Generated at: ${new Date().toISOString()}`,
      `DPI: 300`,
      '',
      'Included aspect ratios:',
    ]

    const aspectRatios: AspectRatio[] = ['2x3', '3x4', '4x5', '11x14', 'ISO']
    if (include5x7) {
      aspectRatios.push('5x7')
    }

    aspectRatios.forEach(ratio => {
      lines.push(`  - ${ratio}`)
    })

    if (includeEverySize) {
      lines.push('')
      lines.push('Every size mode: ENABLED')
      lines.push('Includes all sub-sizes for each aspect ratio')
    } else {
      lines.push('')
      lines.push('Every size mode: DISABLED')
      lines.push('Only master sizes included')
    }

    lines.push('')
    lines.push('Notes:')
    lines.push('- All images are in sRGB color space')
    lines.push('- JPEG quality: 95%')
    lines.push('- Chroma subsampling: 4:4:4')
    lines.push('- 22×30 cm is slightly off true 3:4 ratio')

    return lines.join('\n')
  }

  async finalize(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.archive.finalize()

      const chunks: Buffer[] = []
      this.archive.on('data', (chunk) => {
        chunks.push(chunk)
      })

      this.archive.on('end', () => {
        resolve(Buffer.concat(chunks))
      })

      this.archive.on('error', reject)
    })
  }

  getFileCount(): number {
    return this.files.length
  }

  getTotalSize(): number {
    return this.files.reduce((total, file) => total + file.buffer.length, 0)
  }
}

export async function createStreamingZip(options: ZipOptions): Promise<StreamingZip> {
  const zip = new StreamingZip()
  await zip.addDirectoryStructure(options)
  return zip
}

export function formatFilename(
  basename: string,
  aspectRatio: AspectRatio,
  sizeLabel: string,
  dpi: number = 300
): string {
  return `${basename}_${aspectRatio}_${sizeLabel}_${dpi}dpi.jpg`
}

export function createDirectoryPath(aspectRatio: AspectRatio): string {
  return aspectRatio
}
