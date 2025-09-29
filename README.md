# Etsy Print Sizer

AI-powered image upscaling and print size generation for Etsy sellers. Upload an image and get perfectly sized prints for your Etsy shop with smart cropping and high-quality output.

![Etsy Print Sizer Demo](https://via.placeholder.com/800x400/3b82f6/ffffff?text=Etsy+Print+Demo)

## Features

- **AI Upscaling**: Uses Real-ESRGAN on Replicate for superior upscaling results (optional)
- **Smart Cropping**: Automatically detects faces and salient regions for optimal cropping
- **Multiple Aspect Ratios**: Supports 2:3, 3:4, 4:5, 11:14, ISO A-series, and 5:7 ratios
- **Print-Ready Output**: Generates 300 DPI JPEGs optimized for print production
- **Flexible Sizing**: Master sizes plus optional sub-sizes for complete print kits
- **Streaming ZIP**: Downloads don't consume excessive memory
- **Color Management**: sRGB output with proper ICC profile support

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Optional: [Replicate API token](https://replicate.com/account/api-tokens) for AI upscaling

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd etsy-print-sizer
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your Replicate API token (optional):
   ```env
   REPLICATE_API_TOKEN=your_token_here
   ```

3. **Add sRGB ICC profile (optional):**
   ```bash
   # Download an sRGB ICC profile from https://www.color.org/srgbprofiles.xalter
   # and place it at public/icc/sRGB.icc
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Usage

1. **Upload an image** using drag-and-drop or file picker
2. **Choose processing options**:
   - Enable "Generate every listed size" for complete print kits
   - Include 5×7 inch size if needed
3. **Click "Process & Download ZIP"**
4. **Wait for processing** (can take several minutes for large images)
5. **Download starts automatically** when complete

## Output Structure

The generated ZIP contains:

```
<source_name>/
├── 2x3/
│   ├── <source>_2x3_24x36in_300dpi.jpg    # Master size
│   ├── <source>_2x3_20x30in_300dpi.jpg    # Sub-size (if enabled)
│   ├── <source>_2x3_16x24in_300dpi.jpg    # Sub-size (if enabled)
│   └── ...
├── 3x4/
│   ├── <source>_3x4_18x24in_300dpi.jpg    # Master size
│   └── ...
├── manifest.txt                           # Processing details
```

### Always Included (Master Sizes)

- **2:3** → 24×36 inches (7200×10800px)
- **3:4** → 18×24 inches (5400×7200px)
- **4:5** → 20×25 inches (6000×7500px)
- **11:14** → 22×28 inches (6600×8400px)
- **ISO A1** → 23.39×33.11 inches (7016×9933px)
- **5×7** → 5×7 inches (1500×2100px) *(optional)*

### Optional Sub-Sizes (when "Generate every listed size" is enabled)

**2:3 ratio (inches):** 4×6, 6×9, 8×12, 10×15, 12×18, 16×24, 20×30, 24×36
**2:3 ratio (cm):** 10×15, 20×30, 30×45, 40×60, 50×75, 60×90
**3:4 ratio (inches):** 6×8, 9×12, 12×16, 15×20, 18×24
**3:4 ratio (cm):** 15×20, 22×30, 30×40, 38×50, 45×60
**4:5 ratio (inches):** 4×5, 8×10, 12×15, 16×20, 20×25
**4:5 ratio (cm):** 10×12, 20×25, 28×35, 30×38, 40×50
**11:14 ratio (inches):** 11×14, 22×28
**ISO A-series:** A5, A4, A3, A2, A1
**5×7 ratio:** 5×7 inches

## Technical Details

### Image Processing Pipeline

1. **Load & Normalize**: EXIF orientation, sRGB conversion, alpha flattening
2. **Upscale**: AI (Real-ESRGAN) or Sharp Lanczos to largest required size
3. **Smart Crop**: Face/salient region detection for each aspect ratio
4. **Resize**: Generate all requested sizes
5. **Export**: High-quality JPEG with proper metadata
6. **Archive**: Streaming ZIP with organized folder structure

### Quality Settings

- **JPEG Quality**: 95%
- **Chroma Subsampling**: 4:4:4 (highest quality)
- **Color Space**: sRGB
- **DPI**: 300 (print-ready)
- **Compression**: Maximum (zlib level 9)

### Performance

- **Memory Efficient**: Streaming processing, no full buffering
- **Parallel Processing**: Multiple crops processed simultaneously
- **Smart Fallbacks**: Graceful degradation when AI services unavailable

## API Reference

### POST `/api/process`

Processes an image and returns a ZIP file.

**Request Body (FormData):**
- `file`: Image file (PNG, JPG, GIF up to 50MB)
- `everySizes`: Include all sub-sizes (boolean)
- `include5x7`: Include 5×7 inch size (boolean)

**Response:**
- `Content-Type: application/zip`
- `Content-Disposition: attachment; filename="<name>_Etsy_Print_Kit.zip"`

## Troubleshooting

### Common Issues

**"File size exceeds 50MB limit"**
- Reduce image resolution before uploading
- Use JPEG format instead of PNG for smaller files

**"Processing failed"**
- Check server logs for detailed error messages
- Ensure sufficient memory (at least 2GB recommended)
- Try with a smaller image first

**"AI upscaling failed"**
- Check Replicate API token is valid
- Verify internet connection
- Falls back to Sharp upscaling automatically

**"Colors look wrong"**
- Ensure sRGB ICC profile is installed at `public/icc/sRGB.icc`
- Check source image color profile
- Colors should appear consistent across devices

### Performance Tips

- **Large Images**: Processing can take 2-5 minutes
- **Batch Processing**: Process multiple images in parallel
- **Storage**: Ensure sufficient disk space for temporary files
- **Memory**: 4GB+ RAM recommended for large images

## Development

### Project Structure

```
├── app/
│   ├── api/process/route.ts    # Main processing endpoint
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main UI
├── components/
│   ├── UploadArea.tsx         # File upload component
│   ├── OptionsPanel.tsx       # Processing options
│   ├── ProgressIndicator.tsx  # Progress display
│   └── ProcessingStatus.tsx   # Status messages
├── lib/
│   ├── crop.ts               # Smart cropping logic
│   ├── image.ts              # Image processing utilities
│   ├── sizes.ts              # Size definitions and conversions
│   ├── upscale.ts            # AI and fallback upscaling
│   └── zip.ts                # ZIP streaming utilities
└── public/
    └── icc/
        └── sRGB.icc          # sRGB color profile
```

### Adding New Sizes

1. Update `ASPECT_RATIOS` in `lib/sizes.ts`
2. Add master size to `MASTER_SIZES_300DPI`
3. Add sub-sizes to `INCH_SIZES` and `CM_SIZES`
4. Update UI options if needed

### Customizing Quality

Modify these settings in the relevant files:
- JPEG quality: `lib/image.ts` `saveJpeg()` function
- DPI: `lib/sizes.ts` conversion functions
- Color profile: `public/icc/sRGB.icc`

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review troubleshooting section above

---

*Built with Next.js 14, TypeScript, Tailwind CSS, Sharp, and smartcrop-sharp*
