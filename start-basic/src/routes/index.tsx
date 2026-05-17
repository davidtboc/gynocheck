import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { ImageUpload } from '~/components/ImageUpload'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const [images, setImages] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (images.length === 0) {
      setError('Upload at least one image before submitting.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      sessionStorage.setItem('gyno_images', JSON.stringify(images))

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageCount: images.length }),
      })

      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Failed to create checkout')

      window.location.href = data.url
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

        {/* Left — image upload */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <ImageUpload onImagesChange={setImages} />

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || images.length === 0}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {loading ? 'Redirecting to payment…' : 'Analyze for $1.99'}
            </button>

            {/* Disclaimer box */}
            <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              This is not official medical advice. Please consult a medical professional for a real diagnosis.
            </div>
          </form>
        </div>

        {/* Right — info */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              Doctor Sponsored Gynecomastia Analysis
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
              Upload clear image(s) of your chest from multiple angles to identify if you may or may not have gyno.
            </p>
          </div>

          {/* Trust badge */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-4 space-y-2">
            <p className="text-blue-800 dark:text-blue-200 font-bold text-sm">
              Trained on 1,000s of gynecomastia images — Grade I to Grade III
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-sm font-semibold">
              Sponsored by 4 board-certified plastic surgeons
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
