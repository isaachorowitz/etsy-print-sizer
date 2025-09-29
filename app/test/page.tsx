export default function TestPage() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-4xl font-bold text-green-600 mb-4">✅ Test Page Works!</h1>
      <p className="text-lg text-gray-600">
        If you can see this, the Next.js app is deploying correctly.
      </p>
      <a 
        href="/" 
        className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
      >
        Back to Home
      </a>
    </div>
  )
}
