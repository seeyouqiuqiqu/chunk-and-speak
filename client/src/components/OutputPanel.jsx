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
  extractFirstEnglishLine,
  splitListItems,
  parseRecommendedPattern,
} from '../utils/markdownSections.js'
import { getModeLabel } from '../utils/wordUtils.js'

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

function ModuleCard({ section, children, showCopy = true }) {
  const copyText = showCopy ? section.raw || section.body : ''

  return (
    <article className="relative mb-6 rounded-xl border border-amber-100 bg-white p-4 pr-14 shadow-sm md:p-5">
      <h2 className="mb-3 flex items-center gap-2 border-l-4 border-amber-500 pl-3 text-lg font-bold text-amber-800">
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
          {section.index}
        </span>
        {section.title}
      </h2>
      {children}
      {showCopy && copyText && (
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
    <ModuleCard section={section} showCopy={false}>
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

function ItemCards({ body }) {
  const items = useMemo(() => splitListItems(body), [body])

  if (items.length <= 1) {
    return <MarkdownBody content={body} />
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const english = extractFirstEnglishLine(item)
        return (
          <div
            key={idx}
            className="relative rounded-xl border border-amber-100 bg-amber-50/40 p-4 pr-14"
          >
            <MarkdownBody content={item} />
            {english && (
              <CopyButton text={english} label="复制英文例句" />
            )}
          </div>
        )
      })}
    </div>
  )
}

function RecommendedCard({ pattern, exampleEn, exampleZh }) {
  if (!pattern && !exampleEn) return null

  return (
    <div className="relative mt-4 rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-4 pr-14 shadow-sm md:p-5">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-700">
        推荐句型
      </p>
      {pattern && (
        <p className="mb-3 text-lg font-bold text-amber-900">{pattern}</p>
      )}
      {exampleEn && (
        <>
          <p className="mb-1 text-sm font-medium text-amber-700">使用示例</p>
          <p className="text-gray-800">{exampleEn}</p>
          {exampleZh && (
            <p className="mt-1 text-sm text-gray-600">{exampleZh}</p>
          )}
        </>
      )}
      <CopyButton
        text={[pattern, exampleEn, exampleZh].filter(Boolean).join('\n')}
        label="复制推荐句型"
      />
    </div>
  )
}

function VocabularyTipsSection({ section }) {
  const { tips, pattern, exampleEn, exampleZh } = useMemo(
    () => parseRecommendedPattern(section.body),
    [section.body]
  )

  return (
    <ModuleCard section={section} showCopy={false}>
      {tips && <MarkdownBody content={tips} />}
      <RecommendedCard
        pattern={pattern}
        exampleEn={exampleEn}
        exampleZh={exampleZh}
      />
      {!tips && !pattern && <MarkdownBody content={section.body} />}
    </ModuleCard>
  )
}

function ChunkSections({ sections }) {
  return sections.map((section) =>
    section.index === 4 ? (
      <OralSection key={section.index} section={section} />
    ) : (
      <ModuleCard key={section.index || section.title} section={section}>
        <MarkdownBody content={section.body} />
      </ModuleCard>
    )
  )
}

function VocabularySections({ sections }) {
  return sections.map((section) => {
    if (section.index === 3 || section.index === 5) {
      return (
        <ModuleCard
          key={section.index}
          section={section}
          showCopy={false}
        >
          <ItemCards body={section.body} />
        </ModuleCard>
      )
    }

    if (section.index === 6) {
      return <VocabularyTipsSection key={section.index} section={section} />
    }

    return (
      <ModuleCard key={section.index || section.title} section={section}>
        <MarkdownBody content={section.body} />
      </ModuleCard>
    )
  })
}

function inferModeFromSections(sections) {
  const titles = sections.map((s) => s.title).join(' ')
  if (/核心含义|词性|近义表达|真实口语应用|使用提醒/.test(titles)) {
    return 'vocabulary'
  }
  if (/语感速览|语块拆解|地道口语|书面转口语/.test(titles)) {
    return 'chunk'
  }
  return null
}

export default function OutputPanel({ content, isLoading, error, mode }) {
  const sections = useMemo(() => splitMainSections(content), [content])
  const hasContent = Boolean(content?.trim())
  const resolvedMode =
    mode || inferModeFromSections(sections) || 'chunk'

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
            输入单词、短语或句子，查看语块拆解或词汇精讲。
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
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold text-amber-800">解析结果</h2>
        {resolvedMode && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              resolvedMode === 'vocabulary'
                ? 'bg-sky-100 text-sky-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {getModeLabel(resolvedMode)}
          </span>
        )}
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
        resolvedMode === 'vocabulary' ? (
          <VocabularySections sections={sections} />
        ) : (
          <ChunkSections sections={sections} />
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
