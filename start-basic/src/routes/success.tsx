import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { AnalysisResult } from '~/components/AnalysisResult'

export const Route = createFileRoute('/success')({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: (search.session_id as string) ?? '',
  }),
  component: SuccessPage,
})

function SuccessPage() {
  const { session_id } = Route.useSearch()
  const [result, setResult] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!session_id) {
      setError('Missing payment session. Please try again.')
      setLoading(false)
      return
    }

    const raw = sessionStorage.getItem('gyno_images')
    if (!raw) {
      setError('Images not found. Please upload and pay again.')
      setLoading(false)
      return
    }

    let images: string[]
    try {
      images = JSON.parse(raw)
    } catch {
      setError('Corrupted image data. Please try again.')
      setLoading(false)
      return
    }

    sessionStorage.removeItem('gyno_images')

    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session_id, images }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Analysis failed')
        setResult(data.result)
      })
      .catch((err) => setError(err.message || 'Analysis failed.'))
      .finally(() => setLoading(false))
  }, [session_id])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            GynoCheck
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Payment confirmed — analyzing your images…
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Running AI analysis…
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {result && <AnalysisResult result={result} />}

        {(result || error) && (
          <div className="text-center">
            <a
              href="/"
              className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
            >
              ← Analyze another
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
