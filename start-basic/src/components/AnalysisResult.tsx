import * as React from 'react'

interface AnalysisResultProps {
  result: string
}

const RESULT_LABELS: Record<string, string> = {
  yes: 'Yes, you appear to have gyno.',
  no: "No, you don't appear to have gyno.",
  unclear: 'Unclear if you have gyno. Please consult a surgeon or gyno specialist.',
}

function extractAssessment(result: string): { label: string; body: string } {
  const match = result.match(/overall assessment[:\s]+([^\n]+)/i)
  const raw = match ? match[1].trim().toLowerCase() : 'unclear'
  const key = Object.keys(RESULT_LABELS).find((k) => raw.includes(k)) ?? 'unclear'
  const label = RESULT_LABELS[key]
  const body = result.replace(/^[-•]?\s*overall assessment[:\s]+[^\n]+\n?/im, '').trim()
  return { label, body }
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const { label, body } = extractAssessment(result)

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {label}
      </h2>
      <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
        {body}
      </div>
    </div>
  )
}
