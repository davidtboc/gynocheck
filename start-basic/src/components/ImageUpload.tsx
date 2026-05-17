import * as React from 'react'

const MAX_FILES = 3
const MAX_SIZE_MB = 3
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

interface ImageUploadProps {
  onImagesChange: (dataUrls: string[]) => void
}

export function ImageUpload({ onImagesChange }: ImageUploadProps) {
  const [previews, setPreviews] = React.useState<string[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    setError(null)

    const selected = Array.from(files).slice(0, MAX_FILES)
    const oversized = selected.filter((f) => f.size > MAX_SIZE_BYTES)

    if (oversized.length > 0) {
      setError(`Each image must be under ${MAX_SIZE_MB}MB.`)
      return
    }

    const readers = selected.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        }),
    )

    Promise.all(readers).then((dataUrls) => {
      setPreviews(dataUrls)
      onImagesChange(dataUrls)
    })
  }

  function removeImage(index: number) {
    const updated = previews.filter((_, i) => i !== index)
    setPreviews(updated)
    onImagesChange(updated)
  }

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }}
      >
        <div className="text-4xl mb-2">📷</div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Drag &amp; drop images here, or click to select
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
          Up to {MAX_FILES} images · Max {MAX_SIZE_MB}MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {previews.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {previews.map((src, i) => (
            <div key={i} className="relative group">
              <img
                src={src}
                alt={`Upload ${i + 1}`}
                className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
