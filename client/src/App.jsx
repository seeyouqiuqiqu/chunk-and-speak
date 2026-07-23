import { useCallback, useEffect, useRef, useState } from 'react'
import { BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import InputPanel from './components/InputPanel.jsx'
import OutputPanel from './components/OutputPanel.jsx'
import { parseTextStream } from './services/parseApi.js'
import { countEnglishWords, detectParseMode } from './utils/wordUtils.js'

const FIRST_BYTE_TIMEOUT_MS = 15000

export default function App() {
  const [value, setValue] = useState('')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [parseMode, setParseMode] = useState(null)

  const abortRef = useRef(null)
  const timeoutRef = useRef(null)
  const outputRef = useRef(null)
  const userStoppedRef = useRef(false)

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const handleStop = useCallback(() => {
    userStoppedRef.current = true
    abortRef.current?.abort()
    clearTimers()
    setIsLoading(false)
    toast('已停止生成')
  }, [clearTimers])

  const handleSubmit = useCallback(async () => {
    const trimmed = value.trim()

    if (!trimmed) {
      toast.error('请输入需要解析的英文内容')
      return
    }

    const mode = detectParseMode(trimmed)
    if (!mode || countEnglishWords(trimmed) < 1) {
      toast.error('请输入有效的英文单词、短语或句子')
      return
    }

    if (trimmed.length > 10000) {
      toast.error('文本过长，请控制在 10000 个字符以内')
      return
    }

    abortRef.current?.abort()
    clearTimers()

    const controller = new AbortController()
    abortRef.current = controller
    userStoppedRef.current = false

    timeoutRef.current = setTimeout(() => {
      controller.abort()
    }, FIRST_BYTE_TIMEOUT_MS)

    setIsLoading(true)
    setContent('')
    setError('')
    setParseMode(mode)

    let gotFirstByte = false

    try {
      await parseTextStream(trimmed, {
        signal: controller.signal,
        onMode: (serverMode) => {
          if (serverMode === 'vocabulary' || serverMode === 'chunk') {
            setParseMode(serverMode)
          }
        },
        onChunk: (chunk) => {
          if (!gotFirstByte) {
            gotFirstByte = true
            clearTimers()
          }
          setContent((prev) => prev + chunk)
        },
      })
    } catch (err) {
      if (err?.name === 'AbortError') {
        if (!userStoppedRef.current) {
          const msg = '解析超时，请检查网络或重试'
          setError(msg)
          toast.error(msg)
        }
      } else if (err?.code === 'STREAM_ERROR') {
        setError(err.message)
        toast.error(err.message)
        if (err.partial) setContent(err.partial)
      } else {
        const msg = err?.message || '解析服务暂时不可用，请检查服务配置'
        setError(msg)
        toast.error(msg)
      }
    } finally {
      clearTimers()
      setIsLoading(false)
      abortRef.current = null
    }
  }, [value, clearTimers])

  // 自动滚动到输出区底部（轻量，避免跳动）
  useEffect(() => {
    if (!isLoading || !outputRef.current) return
    outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [content, isLoading])

  // Ctrl/Cmd + Enter 提交
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Enter') return
      if (!(e.metaKey || e.ctrlKey)) return
      e.preventDefault()
      if (!isLoading) handleSubmit()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSubmit, isLoading])

  return (
    <div className="min-h-screen">
      <header className="border-b border-amber-200 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-6 md:px-6">
          <BookOpen className="h-8 w-8 shrink-0 opacity-90" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Chunk & Speak
            </h1>
            <p className="mt-0.5 text-sm text-amber-100 md:text-base">
              把英文拆成能直接开口使用的语块
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        <InputPanel
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          onStop={handleStop}
          isLoading={isLoading}
        />
        <div ref={outputRef}>
          <OutputPanel
            content={content}
            isLoading={isLoading}
            error={error}
            mode={parseMode}
          />
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-gray-400">
        Powered by Lexical Chunking Method
      </footer>
    </div>
  )
}
