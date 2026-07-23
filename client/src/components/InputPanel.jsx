import { EXAMPLES } from '../data/examples.js'
import {
  countEnglishWords,
  detectParseMode,
  getModeLabel,
  getSubmitLabel,
} from '../utils/wordUtils.js'
import LoadingSpinner from './LoadingSpinner.jsx'

export default function InputPanel({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading,
}) {
  const wordCount = countEnglishWords(value)
  const mode = detectParseMode(value)
  const canSubmit = mode !== null && !isLoading

  return (
    <section
      className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm md:p-6"
      aria-labelledby="input-panel-title"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2
          id="input-panel-title"
          className="text-lg font-bold text-amber-800"
        >
          输入英文文本
        </h2>
        {mode && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              mode === 'vocabulary'
                ? 'bg-sky-100 text-sky-800'
                : 'bg-amber-100 text-amber-800'
            }`}
            aria-live="polite"
          >
            {getModeLabel(mode)}
          </span>
        )}
      </div>

      <p className="mb-2 text-sm text-gray-500">
        支持单词、短语、完整句子或英文段落
      </p>

      <label htmlFor="english-input" className="sr-only">
        英文输入框
      </label>
      <textarea
        id="english-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter an English word, phrase, sentence, or paragraph..."
        rows={10}
        disabled={isLoading}
        className="min-h-[220px] w-full resize-y rounded-xl border-2 border-amber-200 px-4 py-3 text-gray-800 placeholder-gray-400 transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-gray-50"
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500" aria-live="polite">
          {wordCount > 0 ? `${wordCount} 个英文单词` : '等待输入…'}
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
          {EXAMPLES.map((example) => (
            <button
              key={example.id}
              type="button"
              disabled={isLoading}
              onClick={() => onChange(example.text)}
              className="shrink-0 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
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
            {getSubmitLabel(mode)}
          </button>
        )}
      </div>
    </section>
  )
}
