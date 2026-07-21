import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import CopyButton from './CopyButton.jsx'
import LoadingSpinner from './LoadingSpinner.jsx'
import {
  splitMainSections,
  parseOralVersions,
  extractEnglishRewrite,
} from '../utils/markdownSections.js'

const markdownComponents = {
  h2: ({ children }) => (
    <h2 className="mt-8 flex items-center gap-2 border-l-4 border-amber-500 pl-3 text-lg font-bold text-amber-800 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 text-base font-semibold text-amber-800">{children}</h3>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-amber-200">
      <table>{children}</table>
    </div>
  ),
}

function MarkdownBody({ content, className = '' }) {
  if (!content?.trim()) return null
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function ModuleCard({ section, children }) {
  const copyText =
    section.index === 4
      ? ''
      : section.index === 2
        ? section.body
        : section.raw

  return (
    <article className="relative mb-6 rounded-xl border border-amber-100 bg-white p-4 pr-14 shadow-sm md:p-5">
      <h2 className="mb-3 flex items-center gap-2 border-l-4 border-amber-500 pl-3 text-lg font-bold text-amber-800">
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
          {section.index}
        </span>
        {section.title}
      </h2>
      {children}
      {section.index !== 4 && copyText && (
        <CopyButton text={copyText} label={`复制第 ${section.index} 模块内容`} />
      )}
    </article>
  )
}

function VersionCard({ title, body, variant }) {
  const styles =
    variant === 'formal'
      ? 'border-blue-200 bg-blue-50'
      : 'border-green-200 bg-green-50'
  const titleColor =
    variant === 'formal' ? 'text-blue-800' : 'text-green-800'
  const english = extractEnglishRewrite(body)

  return (
    <div className={`relative mb-4 rounded-xl border-2 ${styles} p-4 pr-14 md:p-5`}>
      <h4 className={`mb-3 font-bold ${titleColor}`}>{title}</h4>
      <MarkdownBody content={body} />
      <CopyButton text={english} label={`复制${title}英文改写`} />
    </div>
  )
}

function OralSection({ section }) {
  const { intro, version1, version2 } = useMemo(
    () => parseOralVersions(section.body),
    [section.body]
  )

  return (
    <ModuleCard section={section}>
      {intro && <MarkdownBody content={intro} className="mb-3" />}
      {version1 && (
        <VersionCard
          title="版本一：自然流畅风"
          body={version1}
          variant="formal"
        />
      )}
      {version2 && (
        <VersionCard
          title="版本二：随性地道风"
          body={version2}
          variant="casual"
        />
      )}
      {!version1 && !version2 && <MarkdownBody content={section.body} />}
    </ModuleCard>
  )
}

export default function OutputPanel({ content, isLoading, error }) {
  const sections = useMemo(() => splitMainSections(content), [content])
  const hasContent = Boolean(content?.trim())

  if (error && !hasContent) {
    return (
      <section
        className="min-h-[280px] rounded-2xl border border-red-200 bg-white p-6 shadow-sm"
        aria-live="polite"
      >
        <h2 className="mb-2 text-lg font-bold text-red-600">解析失败</h2>
        <p className="text-red-500">{error}</p>
      </section>
    )
  }

  if (!hasContent && !isLoading) {
    return (
      <section className="min-h-[280px] rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-amber-800">解析结果</h2>
        <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
          <p className="text-base text-gray-500">解析结果会显示在这里</p>
          <p className="mt-1 text-sm">
            输入一段英文，看看它由哪些高频语块组成。
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      className="min-h-[280px] rounded-2xl border border-amber-200 bg-white p-5 shadow-sm md:p-6"
      aria-live="polite"
      aria-busy={isLoading}
    >
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-bold text-amber-800">解析结果</h2>
        {isLoading && (
          <span className="ml-auto flex items-center gap-2 text-sm text-amber-600">
            <LoadingSpinner className="h-4 w-4" />
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            正在生成…
          </span>
        )}
      </div>

      {error && hasContent && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {sections.length > 0 ? (
        sections.map((section) =>
          section.index === 4 ? (
            <OralSection key={section.index} section={section} />
          ) : (
            <ModuleCard key={section.index || section.title} section={section}>
              <MarkdownBody content={section.body} />
            </ModuleCard>
          )
        )
      ) : (
        <div className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </section>
  )
}
