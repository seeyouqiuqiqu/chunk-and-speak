import { EXAMPLES } from '../data/examples.js'
import LoadingSpinner from './LoadingSpinner.jsx'

function countEnglishWords(text) {
  const matches = text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)
  return matches ? matches.length : 0
}

export default function InputPanel({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading,
}) {
  const wordCount = countEnglishWords(value)
  const canSubmit = value.trim().length > 0 && !isLoading

  return (
    <section
      className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm md:p-6"
      aria-labelledby="input-panel-title"
    >
      <h2
        id="input-panel-title"
        className="mb-4 text-lg font-bold text-amber-800"
      >
        输入英文文本
      </h2>

      <label htmlFor="english-input" className="sr-only">
        英文输入框
      </label>
      <textarea
        id="english-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste an English sentence or paragraph here..."
        rows={10}
        disabled={isLoading}
        className="min-h-[220px] w-full resize-y rounded-xl border-2 border-amber-200 px-4 py-3 text-gray-800 placeholder-gray-400 transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-gray-50"
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500" aria-live="polite">
          {wordCount > 0 ? `${wordCount} 个英文单词` : '等待输入…'}
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example.id}
              type="button"
              disabled={isLoading}
              onClick={() => onChange(example.text)}
              className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-white px-6 py-3 font-semibold text-amber-700 transition-colors hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <LoadingSpinner className="h-5 w-5" />
            停止生成
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
          >
            一键解析
          </button>
        )}
      </div>
    </section>
  )
}
