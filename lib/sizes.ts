export const ASPECT_RATIOS = {
  '2x3': 2/3,
  '3x4': 3/4,
  '4x5': 4/5,
  '11x14': 11/14,
  'ISO': 1/Math.SQRT2, // A-series ratio
  '5x7': 5/7,
} as const

export type AspectRatio = keyof typeof ASPECT_RATIOS

export const MASTER_SIZES_300DPI: Record<AspectRatio, [number, number]> = {
  '2x3': [24, 36],
  '3x4': [18, 24],
  '4x5': [20, 25],
  '11x14': [22, 28],
  'ISO': [23.39, 33.11],
  '5x7': [5, 7],
}

export const INCH_SIZES: Record<AspectRatio, Array<{ label: string; dimensions: [number, number] }>> = {
  '2x3': [
    { label: '4x6', dimensions: [4, 6] },
    { label: '6x9', dimensions: [6, 9] },
    { label: '8x12', dimensions: [8, 12] },
    { label: '10x15', dimensions: [10, 15] },
    { label: '12x18', dimensions: [12, 18] },
    { label: '16x24', dimensions: [16, 24] },
    { label: '20x30', dimensions: [20, 30] },
    { label: '24x36', dimensions: [24, 36] },
  ],
  '3x4': [
    { label: '6x8', dimensions: [6, 8] },
    { label: '9x12', dimensions: [9, 12] },
    { label: '12x16', dimensions: [12, 16] },
    { label: '15x20', dimensions: [15, 20] },
    { label: '18x24', dimensions: [18, 24] },
  ],
  '4x5': [
    { label: '4x5', dimensions: [4, 5] },
    { label: '8x10', dimensions: [8, 10] },
    { label: '12x15', dimensions: [12, 15] },
    { label: '16x20', dimensions: [16, 20] },
    { label: '20x25', dimensions: [20, 25] },
  ],
  '11x14': [
    { label: '11x14', dimensions: [11, 14] },
    { label: '22x28', dimensions: [22, 28] },
  ],
  'ISO': [
    { label: 'A5', dimensions: [5.83, 8.27] },
    { label: 'A4', dimensions: [8.27, 11.69] },
    { label: 'A3', dimensions: [11.69, 16.54] },
    { label: 'A2', dimensions: [16.54, 23.39] },
    { label: 'A1', dimensions: [23.39, 33.11] },
  ],
  '5x7': [
    { label: '5x7', dimensions: [5, 7] },
  ],
}

export const CM_SIZES: Record<AspectRatio, Array<{ label: string; dimensions: [number, number] }>> = {
  '2x3': [
    { label: '10x15', dimensions: [10, 15] },
    { label: '20x30', dimensions: [20, 30] },
    { label: '30x45', dimensions: [30, 45] },
    { label: '40x60', dimensions: [40, 60] },
    { label: '50x75', dimensions: [50, 75] },
    { label: '60x90', dimensions: [60, 90] },
  ],
  '3x4': [
    { label: '15x20', dimensions: [15, 20] },
    { label: '22x30', dimensions: [22, 30] }, // Note: slightly off true 3:4 ratio
    { label: '30x40', dimensions: [30, 40] },
    { label: '38x50', dimensions: [38, 50] },
    { label: '45x60', dimensions: [45, 60] },
  ],
  '4x5': [
    { label: '10x12', dimensions: [10, 12] },
    { label: '20x25', dimensions: [20, 25] },
    { label: '28x35', dimensions: [28, 35] },
    { label: '30x38', dimensions: [30, 38] },
    { label: '40x50', dimensions: [40, 50] },
  ],
  '11x14': [], // No standard cm sizes for 11x14
  'ISO': [], // Already in cm for ISO sizes
  '5x7': [], // No standard cm sizes for 5x7
}

export function inchesToPx(inches: number, dpi: number = 300): number {
  return Math.round(inches * dpi)
}

export function cmToPx(cm: number, dpi: number = 300): number {
  return Math.round((cm / 2.54) * dpi)
}

export function mmToPx(mm: number, dpi: number = 300): number {
  return Math.round((mm / 25.4) * dpi)
}

export function getMasterDimensions(aspectRatio: AspectRatio): [number, number] {
  const [w, h] = MASTER_SIZES_300DPI[aspectRatio]
  return [inchesToPx(w), inchesToPx(h)]
}

export function getAllSizes(aspectRatio: AspectRatio, includeEverySize: boolean = false): Array<{
  label: string
  dimensions: [number, number]
  type: 'master' | 'sub'
}> {
  const result = []

  // Always include master size
  const masterDims = MASTER_SIZES_300DPI[aspectRatio]
  result.push({
    label: `${masterDims[0]}x${masterDims[1]}in`,
    dimensions: masterDims,
    type: 'master' as const,
  })

  if (includeEverySize) {
    // Add inch sizes
    INCH_SIZES[aspectRatio].forEach(size => {
      if (size.label !== `${masterDims[0]}x${masterDims[1]}`) {
        result.push({
          label: size.label,
          dimensions: size.dimensions,
          type: 'sub' as const,
        })
      }
    })

    // Add cm sizes
    CM_SIZES[aspectRatio].forEach(size => {
      result.push({
        label: size.label,
        dimensions: size.dimensions,
        type: 'sub' as const,
      })
    })
  }

  return result
}

export function getLargestMasterArea(): { width: number; height: number } {
  const allMasters = Object.values(MASTER_SIZES_300DPI)
  let maxArea = 0
  let largestDims = { width: 0, height: 0 }

  for (const [w, h] of allMasters) {
    const area = w * h
    if (area > maxArea) {
      maxArea = area
      largestDims = { width: inchesToPx(w), height: inchesToPx(h) }
    }
  }

  return largestDims
}

export function formatSizeLabel(aspectRatio: AspectRatio, dimensions: [number, number], isCm: boolean = false): string {
  const [w, h] = dimensions
  const unit = isCm ? 'cm' : 'in'
  return `${w}x${h}${unit}`
}

export function formatPixelDimensions(dimensions: [number, number]): string {
  const [w, h] = dimensions
  return `${w}x${h}px`
}
