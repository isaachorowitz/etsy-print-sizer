/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['sharp', 'smartcrop-sharp'],
  images: {
    domains: ['replicate.delivery'],
  },
  async headers() {
    return [
      {
        source: '/api/process',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
}

export default nextConfig
