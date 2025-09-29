'use client'

interface Options {
  everySizes: boolean
  include5x7: boolean
}

interface OptionsPanelProps {
  options: Options
  onChange: (options: Options) => void
  disabled?: boolean
}

export function OptionsPanel({ options, onChange, disabled }: OptionsPanelProps) {
  const updateOption = (key: keyof Options, value: boolean) => {
    onChange({ ...options, [key]: value })
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Options</h3>

      <div className="space-y-3">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.everySizes}
            onChange={(e) => updateOption('everySizes', e.target.checked)}
            disabled={disabled}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">
              Generate every listed size (inches + centimeters)
            </span>
            <p className="text-xs text-gray-500">
              Includes all sub-sizes for each aspect ratio (slower processing, larger ZIP)
            </p>
          </div>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.include5x7}
            onChange={(e) => updateOption('include5x7', e.target.checked)}
            disabled={disabled}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">
              Include 5×7 inch size
            </span>
            <p className="text-xs text-gray-500">
              Adds 5×7 inch (1500×2100px) master size
            </p>
          </div>
        </label>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <p className="text-xs text-blue-800">
          <strong>Always included:</strong> Master sizes for 2:3, 3:4, 4:5, 11:14, and ISO A1 ratios at 300 DPI
        </p>
      </div>
    </div>
  )
}
